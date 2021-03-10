import time
import pickle

import graph
import utils

import networkx as nx

import debias_result as pagerank


def fair(name, vanilla, lambda_=0., similarity=None):
    # vanilla result
    r = vanilla[name]
    print(r.shape)
    # load dataset
    data = graph.read_mat(name)
    A = data['adjacency']
    A = utils.symmetric_normalize(A)

    # build similarity matrix
    S = utils.filter_similarity_matrix(utils.get_similarity_matrix(A, metric=similarity), sigma=0.75)
    S = utils.symmetric_normalize(S)
    print(S.shape)
    # debias pagerank
    start = time.perf_counter()
    r = pagerank.debias_result(r, S, lambda_)
    end = time.perf_counter()

    print('dataset: {}\t similarity: {}'.format(name, similarity))
    print('elapsed time: {} seconds'.format(end-start))
    # print(r)

    return r


if __name__ == '__main__':
    lambda_ = 0.5

    with open('result/pagerank/vanilla.pickle', 'rb') as f:
        vanilla = pickle.load(f)

    # jaccard index
    result = dict()
    result['ppi'] = fair('ppi', vanilla, lambda_=lambda_, similarity='jaccard')

    with open('result/pagerank/result/jaccard.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)

    # cosine similarity    
    result = dict()
    result['ppi'] = fair('ppi', vanilla, lambda_=lambda_, similarity='cosine')

    with open('result/pagerank/result/cosine.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)

