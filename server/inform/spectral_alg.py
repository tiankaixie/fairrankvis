import time
import pickle

import graph
import utils

import numpy as np
import networkx as nx

import debias_spectral as sc 


def fair(name, v0, lambda_=0.0, similarity=None):
    # load dataset
    data = graph.read_mat(name)
    G = data['graph']
    cc = max(nx.connected_components(G), key=len)  # take largest connected components
    A = nx.to_scipy_sparse_matrix(G, nodelist=cc, dtype='float', format='csc')

    # build similarity matrix
    S = utils.get_similarity_matrix(A, metric=similarity)

    # debias spectral clustering
    start = time.perf_counter()
    V, U = sc.debias_alg(A, S, lambda_, ncluster=10, v0=v0[name])
    end = time.perf_counter()

    print('dataset: {}\t similarity: {}'.format(name, similarity))
    print('elapsed time: {} seconds'.format(end-start))
    print()

    return U



if __name__ == '__main__':
    v0 = pickle.load(open('data/v0.pickle', 'rb'))
    # jaccard index
    result = dict()
    result['ppi'] = fair('ppi', v0, lambda_=0.5, similarity='jaccard')

    with open('result/spectral/alg/jaccard.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)

    # cosine similarity    
    result = dict()
    result['ppi'] = fair('ppi', v0, lambda_=0.5, similarity='cosine')

    with open('result/spectral/alg/cosine.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)


