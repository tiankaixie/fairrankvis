import time
import pickle

import graph
import utils

import scipy.io as sio
import networkx as nx

import debias_result as LINE


def fair(name, vanilla, lambda_=0., similarity=None):
    # vanilla result
    X = vanilla[name]

    # load dataset
    data = graph.read_pickle(name)
    A_train = data['adjacency_train']

    # build similarity matrix
    S = utils.filter_similarity_matrix(utils.get_similarity_matrix(A_train, metric=similarity), sigma=0.75)

    # debias LINE
    start = time.perf_counter()
    X = LINE.debias_result(X, S, lambda_)
    end = time.perf_counter()

    print('dataset: {}\t similarity: {}'.format(name, similarity))
    print('elapsed time: {} seconds'.format(end-start))
    print()

    return X



if __name__ == '__main__':
    with open('result/line/vanilla.pickle', 'rb') as f:
        vanilla = pickle.load(f)

    # jaccard index
    result = dict()
    result['ppi'] = fair('ppi', vanilla, lambda_=0.5, similarity='jaccard')

    with open('result/line/result/jaccard.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)

    # cosine similarity    
    result = dict()
    result['ppi'] = fair('ppi', vanilla, lambda_=0.5, similarity='cosine')

    with open('result/line/result/cosine.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)
