import time
import pickle
import logging

import graph
import utils

import networkx as nx

import debias_spectral as sc 

from scipy.sparse.csgraph import laplacian
from scipy.sparse.linalg import eigsh


def fair(name, v0, lambda_=0.0, lr=0.0, similarity=None):
    # load graph
    data = graph.read_mat(name)
    G = data['graph']
    cc = max(nx.connected_components(G), key=len)  # take largest connected components
    A0 = nx.to_scipy_sparse_matrix(G, nodelist=cc, dtype='float', format='csc')

    # build similarity matrix
    S = utils.get_similarity_matrix(A0, metric=similarity)

    # debias spectral clustering
    start = time.perf_counter()
    A = sc.debias_graph(A0, S, lambda_, ncluster=10, v0=v0[name], maxiter=100, lr=lr, tol=1e-6)
    L = laplacian(A)
    L *= -1
    V, U = eigsh(L, which='LM', k=10, sigma=1.0, v0=v0[name])
    end = time.perf_counter()

    print('dataset: {}\tsimilarity: {}'.format(name, similarity))
    print('elapsed time: {} seconds'.format(end-start))
    print()

    return U


if __name__ == '__main__':
    v0 = pickle.load(open('data/v0.pickle', 'rb'))
    # jaccard index
    result = dict()
    result['ppi'] = fair('ppi', v0, lambda_=1e7, lr=0.05, similarity='jaccard')

    with open('result/spectral/graph/jaccard.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)

    # cosine similarity
    result = dict()
    result['ppi'] = fair('ppi', v0, lambda_=1e7, lr=0.05, similarity='cosine')
    
    with open('result/spectral/graph/cosine.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)
