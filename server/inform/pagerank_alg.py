import time
import pickle

import graph
import utils

import numpy as np

import debias_pagerank as pagerank

from scipy.sparse import csc_matrix


def fair(name, lambda_=0., similarity=None):
    # params
    c = 0.85

    # load dataset
    data = graph.read_mat(name)
    A = data['adjacency']
    A = utils.symmetric_normalize(A)

    # build similarity matrix
    S = utils.filter_similarity_matrix(utils.get_similarity_matrix(A, metric=similarity), sigma=0.75)
    S = utils.symmetric_normalize(S)

    # debias pagerank
    start = time.perf_counter()
    r = pagerank.debias_alg(A, S, lambda_, c=c)
    end = time.perf_counter()

    r = np.array([list(r.values())])
    r = csc_matrix(np.array(r).transpose())

    print('dataset: {}\t similarity: {}'.format(name, similarity))
    print('elapsed time: {} seconds'.format(end-start))
    print()

    return r


if __name__ == '__main__':
    lambda_ = 0.5

    # jaccard index
    result = dict()
    result['ppi'] = fair('ppi', lambda_=lambda_, similarity='jaccard')

    with open('result/pagerank/alg/jaccard.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)

    # cosine similarity    
    result = dict()
    result['ppi'] = fair('ppi', lambda_=lambda_, similarity='cosine')

    with open('result/pagerank/alg/cosine.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)