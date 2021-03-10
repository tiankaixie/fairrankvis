import time
import torch

import torch.nn as nn
import numpy as np
import networkx as nx
import sklearn.preprocessing as skpp

from scipy.sparse.csgraph import laplacian


def debias_graph(A0, S, lambda_, maxiter=100, lr=0.1, tol=1e-6):
    A = A0.copy().tocoo()
    row = A.row
    col = A.col
    A = A.tocsc()
    LS = laplacian(S).tocoo()
    LSrow = LS.row
    LScol = LS.col
    LS = LS.tocsc()
    nsimedges, nedges = LS.nnz, A.nnz
    residual_prev, residual = np.inf, np.inf
    for niter in range(maxiter):
        residual_prev = residual
        # calculate first column of diag(BLs)1, which is diag(BLs)
        BLS = np.asarray([0.0] * A0.shape[0])
        d = A.sum(axis=1).T
        d025 = np.power(d, 0.25)
        d075 = np.power(d, 0.75)
        d125 = np.power(d, 1.25)
        for idx in range(nsimedges):
            s, t = LSrow[idx], LScol[idx]
            if (s > t) or (d[0, t] == 0) or (d[0, s] == 0):
                continue
            denom1 = 4.0 * ((d125[0, t] / d025[0, s]) + d[0, t])
            first = 3.0 / denom1
            denom2 = (d075[0, t] * d025[0, s]) + d[0, t]
            second = 1.0 / denom2
            Bts = first + second
            BLS[t] += float(Bts * LS[s, t])
            if s != t:
                denom1 = 4.0 * ((d125[0, s] / d025[0, t]) + d[0, s])
                first = 3.0 / denom1
                denom2 = (d075[0, s] * d025[0, t]) + d[0, s]
                second = 1.0 / denom2
                Bst = first + second
                BLS[s] += float(Bst * LS[t, s])

        # iterate each edge to update gradient
        residual, sfnorm = 0, 0
        for idx in range(nedges):
            s, t = row[idx], col[idx]
            if s > t:
                continue
            if s != t:
                norm_grad = 4 * (A[s, t] - A0[s, t])
                partial_grad = partial_grad_wrt_graph(A, LS, BLS, s, t, lambda_) + partial_grad_wrt_graph(A, LS, BLS, t, s, lambda_)
                grad = norm_grad + partial_grad
            else:
                norm_grad = 2 * (A[s, t] - A0[s, t])
                partial_grad = partial_grad_wrt_graph(A, LS, BLS, s, t, lambda_)
                grad = norm_grad + partial_grad

            if A[s, t] >= lr * grad:
                A[s, t] -= lr * grad
                residual += (grad ** 2)
                sfnorm += ((A[s, t] - A0[s, t]) ** 2)
                if s != t:
                    A[t, s] -= lr * grad
                    residual += (grad ** 2)
                    sfnorm += ((A[t, s] - A0[t, s]) ** 2)
        
        if np.sqrt(residual) < tol:
            return A
    return A


def partial_grad_wrt_graph(A, LS, BLS, s, t, lambda_):
    first = LS[s, t] / (A[s, t] + A[t, s])  # f(A+A') * LS
    second = BLS[s]  # diag(BLS)
    partial_grad = lambda_ * (first - second)
    return 2 * partial_grad


class debias_alg():
    def __init__(self, dimension=128, ratio=3200, negative=5, batch_size=1000, alpha=0.025, lambda_=0, similarity_matrix=None, seed=None):
        self.dimension = dimension
        self.ratio = ratio
        self.negative = negative
        self.batch_size = batch_size
        self.init_alpha = alpha
        self.lambda_ = lambda_
        self.similarity_matrix = similarity_matrix
        if seed is not None:
            np.random.seed(seed)

    def train(self, G):
        self.G = G
        self.is_directed = nx.is_directed(self.G)
        self.num_node = G.number_of_nodes()
        self.num_sampling_edge = self.ratio * self.num_node

        node2id = dict([(node, vid) for vid, node in enumerate(G.nodes())])
        self.edges = [[node2id[e[0]], node2id[e[1]]] for e in self.G.edges()]
        self.edges_prob = np.asarray([G[u][v].get("weight", 1.0) for u, v in G.edges()])
        self.edges_prob /= np.sum(self.edges_prob)
        self.edges_table, self.edges_prob = alias_setup(self.edges_prob)

        degree_weight = np.asarray([0] * self.num_node)
        for u, v in G.edges():
            degree_weight[node2id[u]] += G[u][v].get("weight", 1.0)
            if not self.is_directed:
                degree_weight[node2id[v]] += G[u][v].get("weight", 1.0)
        self.node_prob = np.power(degree_weight, 0.75)
        self.node_prob /= np.sum(self.node_prob)
        self.node_table, self.node_prob = alias_setup(self.node_prob)

        self.emb_vertex = (np.random.random((self.num_node, self.dimension)) - 0.5) / self.dimension
        self._train_line()
        self.embeddings = skpp.normalize(self.emb_vertex, "l2")
        
        return self.embeddings

    def _update(self, vec_u, vec_v, vec_error, label, u, v):
        # update vetex embedding and vec_error
        f = 1 / (1 + np.exp(-np.sum(vec_u * vec_v, axis=1)))
        g = (self.alpha * (label - f)).reshape((len(label), 1))
        vec_error += g * vec_v
        vec_v += g * vec_u
        if label[0] == 1:
            arr = np.asarray(self.similarity_matrix[u, v].transpose())
            vec_error -= (2 * self.alpha * self.lambda_ * (vec_u - vec_v) * arr)
            vec_v -= (2 * self.alpha * self.lambda_ * (vec_v - vec_u) * arr)

    def _train_line(self):
        self.alpha = self.init_alpha
        batch_size = self.batch_size
        num_batch = int(self.num_sampling_edge / batch_size)
        epoch_iter = range(num_batch)
        for b in epoch_iter:
            self.alpha = self.init_alpha * max((1 - b * 1.0 / num_batch), 0.0001)
            u, v = [0] * batch_size, [0] * batch_size
            for i in range(batch_size):
                edge_id = alias_draw(self.edges_table, self.edges_prob)
                u[i], v[i] = self.edges[edge_id]
                if not self.is_directed and np.random.rand() > 0.5:
                    v[i], u[i] = self.edges[edge_id]

            vec_error = np.zeros((batch_size, self.dimension))
            label, target = np.asarray([1 for i in range(batch_size)]), np.asarray(v)
            for j in range(self.negative+1):
                if j != 0:
                    label = np.asarray([0 for i in range(batch_size)])
                    for i in range(batch_size):
                        target[i] = alias_draw(self.node_table, self.node_prob)
                self._update(
                    self.emb_vertex[u], self.emb_vertex[target], vec_error, label, u, target
                )
            self.emb_vertex[u] += vec_error


def alias_setup(probs):
    """
    Compute utility lists for non-uniform sampling from discrete distributions.
    Refer to https://hips.seas.harvard.edu/blog/2013/03/03/the-alias-method-efficient-sampling-with-many-discrete-outcomes/
    for details
    """
    K = len(probs)
    q = np.zeros(K)
    J = np.zeros(K, dtype=np.int)

    smaller = []
    larger = []
    for kk, prob in enumerate(probs):
        q[kk] = K * prob
        if q[kk] < 1.0:
            smaller.append(kk)
        else:
            larger.append(kk)

    while len(smaller) > 0 and len(larger) > 0:
        small = smaller.pop()
        large = larger.pop()

        J[small] = large
        q[large] = q[large] + q[small] - 1.0
        if q[large] < 1.0:
            smaller.append(large)
        else:
            larger.append(large)

    return J, q


def alias_draw(J, q):
    """
    Draw sample from a non-uniform discrete distribution using alias sampling.
    """
    K = len(J)

    kk = int(np.floor(np.random.rand() * K))
    if np.random.rand() < q[kk]:
        return kk
    else:
        return J[kk]
