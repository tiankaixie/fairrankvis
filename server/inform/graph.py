import os
import pickle

import networkx as nx
import scipy.io as sio


def read_mat(name):
    result = dict()
    PATH = os.path.join('data', '{}.mat'.format(name))
    matfile = sio.loadmat(PATH)
    result['adjacency'] = matfile['network']
    result['label'] = matfile['group']
    result['graph'] = nx.from_scipy_sparse_matrix(result['adjacency'], create_using=nx.Graph(), edge_attribute='weight')
    return result


def read_pickle(name):
    with open('data/{}.pickle'.format(name), 'rb') as f:
        result = pickle.load(f)
    return result

