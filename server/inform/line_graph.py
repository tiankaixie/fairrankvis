import time
import pickle

import graph
import utils

import networkx as nx

import line_vanilla as vanilla
import debias_line as LINE


def fair(name, lambda_=0., lr=0., similarity=None):
    # load dataset
    data = graph.read_pickle(name)
    A0 = data['adjacency_train']

    # build similarity matrix
    S = utils.filter_similarity_matrix(utils.get_similarity_matrix(A0, metric=similarity), sigma=0.75)

    # debias LINE
    start1 = time.perf_counter()
    A = LINE.debias_graph(A0, S, lambda_, maxiter=100, lr=lr, tol=1e-6)
    end1 = time.perf_counter()
    G = nx.from_scipy_sparse_matrix(A, create_using=nx.Graph(), edge_attribute='weight')
    start2 = time.perf_counter()
    model = vanilla.LINE(ratio=3200, seed=0)
    X = model.train(G)
    end2 = time.perf_counter()
    
    print('dataset: {}\tsimilarity: {}'.format(name, similarity))
    print('elapsed time: {} seconds'.format(end1-start1 + end2 - start2))
    print()

    return X


if __name__ == '__main__':
    # jaccard index
    result = dict()
    result['ppi'] = fair('ppi', lambda_=10, lr=0.025, similarity='jaccard')

    with open('result/line/graph/jaccard.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)

    # cosine similarity    
    result = dict()
    result['ppi'] = fair('ppi', lambda_=10, lr=0.025, similarity='cosine')
    
    with open('result/line/graph/cosine.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)
