import time
import pickle

import graph
import utils

import numpy as np
import scipy.io as sio
import networkx as nx

import debias_line as LINE


def fair(name, lambda_=0., similarity=None):
    # load dataset
    data = graph.read_pickle(name)
    A_train = data['adjacency_train']
    G = nx.from_scipy_sparse_matrix(A_train, create_using=nx.Graph(), edge_attribute='weight')

    # build similarity matrix
    S = utils.filter_similarity_matrix(utils.get_similarity_matrix(A_train, metric=similarity), sigma=0.75)

    # debias LINE
    start = time.perf_counter()
    model = LINE.debias_alg(lambda_=lambda_, similarity_matrix=S, seed=0, ratio=3200)
    X = model.train(G)
    end = time.perf_counter()

    print('dataset: {}\tsimilarity: {}'.format(name, similarity))
    print('elapsed time: {} seconds'.format(end - start))
    print()

    return X


if __name__ == '__main__':
    # jaccard index
    result = dict()
    result['ppi'] = fair('ppi', lambda_=0.5, similarity='jaccard')

    with open('result/line/alg/jaccard.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)

    # cosine similarity    
    result = dict()
    result['ppi'] = fair('ppi', lambda_=0.5, similarity='cosine')

    with open('result/line/alg/cosine.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)
