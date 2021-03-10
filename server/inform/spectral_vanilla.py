import pickle

import graph
import networkx as nx

from scipy.sparse.csgraph import laplacian
from scipy.sparse.linalg import eigsh


def vanilla_spectral_clustering(name, v0):
    try:
        with open('result/spectral/vanilla.pickle', 'rb') as f:
            UDict = pickle.load(f)
    except:
        UDict = dict()

    data = graph.read_mat(name)
    G = data['graph']
    cc = max(nx.connected_components(G), key=len)  # take largest connected components
    A = nx.to_scipy_sparse_matrix(G, nodelist=cc, dtype='float', format='csc')
    L = laplacian(A)
    L *= -1
    V, U = eigsh(L, which='LM', k=10, sigma=1.0, v0=v0[name])
    UDict[name] = dict()
    UDict[name]['eigenvalues'] = V
    UDict[name]['eigenvectors'] = U

    with open('result/spectral/vanilla.pickle', 'wb') as f:
        pickle.dump(UDict, f, protocol=pickle.HIGHEST_PROTOCOL)


if __name__ == '__main__':
    name = 'ppi'
    v0 = pickle.load(open('data/v0.pickle', 'rb'))  # load initialization vector
    vanilla_spectral_clustering(name, v0=v0)
