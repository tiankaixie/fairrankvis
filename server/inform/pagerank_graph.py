import time
import pickle

import graph
import utils

import numpy as np

import debias_pagerank as pagerank

from scipy.sparse import csc_matrix


def fair(name, lambda_=0., lr=0., similarity=None):
    data = graph.read_mat(name)
    A0 = data['adjacency']
    A0 = utils.symmetric_normalize(A0)
    c = 0.85

    # build similarity matrix
    S = utils.filter_similarity_matrix(utils.get_similarity_matrix(A0, metric=similarity), sigma=0.75)
    S = utils.symmetric_normalize(S)

    # debias pagerank
    start = time.perf_counter()
    G = pagerank.debias_graph(A0, S, lambda_, lr=lr, c=c, tol=1e-6, maxiter=100)  # old maxiter is 100, old tol is 1e-7
    r = utils.power_method(G, c=c)
    end = time.perf_counter()

    r = np.array([list(r.values())])
    r = csc_matrix(np.array(r).transpose())

    print('dataset: {}\t similarity: {}'.format(name, similarity))
    print('elapsed time: {} seconds'.format(end-start))
    print()

    return r


if __name__ == '__main__':
    # jaccard index
    result = dict()
    result['ppi'] = fair('ppi', lambda_=1e6, lr=5e-4, similarity='jaccard')

    with open('result/pagerank/graph/jaccard.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)

    # cosine similarity    
    result = dict()
    result['ppi'] = fair('ppi', lambda_=1e6, lr=5e-4, similarity='cosine')

    with open('result/pagerank/graph/cosine.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)