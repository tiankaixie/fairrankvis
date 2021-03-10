import pickle

import graph
import utils

import numpy as np
import networkx as nx

from scipy.sparse import csc_matrix


def vanilla_pagerank(name):
    result = dict()
    data = graph.read_mat(name)
    A = data['adjacency']

    A = utils.symmetric_normalize(A)
    G = nx.from_scipy_sparse_matrix(A, create_using=nx.Graph())

    r = utils.power_method(G, c=0.85)
    r = np.array([list(r.values())])
    r = csc_matrix(np.array(r).transpose())
    result[name] = r

    with open('result/pagerank/vanilla.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)


if __name__ == '__main__':
    vanilla_pagerank(name='ppi')
