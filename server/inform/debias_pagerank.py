import utils

import numpy as np
import networkx as nx

from scipy.sparse import csc_matrix
from scipy.sparse.csgraph import laplacian


def debias_graph(A0, S, lambda_, c=0.85, maxiter=100, lr=0.1, tol=1e-6):
    G = nx.from_scipy_sparse_matrix(A0, create_using=nx.Graph())
    LS = laplacian(S)
    residual_prev, residual = np.inf, np.inf
    for niter in range(maxiter):
        residual_prev = residual
        # calc low-rank structure
        r = utils.power_method(G, c=c, maxiter=maxiter)
        r = np.array([list(r.values())])
        r = csc_matrix(np.array(r).transpose())
        LSr = LS @ r
        QLSr = utils.reverse_power_method(G, c=c, personalization=LSr, maxiter=maxiter)
        QLSr = np.array([list(QLSr.values())])
        QLSr = csc_matrix(np.array(QLSr).transpose())

        # iterate each edge to update gradient
        residual = 0
        for e in G.edges:
            s, t = e
            if s != t:
                grad = 4 * (G[s][t]['weight'] - A0[s, t]) + partial_grad_wrt_graph(QLSr, r, s, t, lambda_, c=c) + partial_grad_wrt_graph(QLSr, r, t, s, lambda_, c=c)
            else:
                grad = 2 * (G[s][t]['weight'] - A0[s, t]) + partial_grad_wrt_graph(QLSr, r, s, t, lambda_, c=c)
            if G[s][t]['weight'] >= lr * grad:
                G[s][t]['weight'] -= lr * grad
                residual += (grad ** 2)

        if np.sqrt(residual) < tol:
            return G
    return G


def partial_grad_wrt_graph(x, r, s, t, lambda_, c=0.85):
    partial_grad = lambda_ * c * x[s, 0] * r[t, 0]
    return 2 * partial_grad


def debias_alg(A, S, lambda_, c=0.85):
    W = ((c / (1+lambda_)) * A) + (((lambda_) / (1+lambda_)) * S)
    G = nx.from_scipy_sparse_matrix(W, create_using=nx.Graph())
    r = utils.new_power_method(G, c=c, lambda_=lambda_)
    return r
