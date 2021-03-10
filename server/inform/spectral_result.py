import time
import pickle

import graph
import utils

import networkx as nx

import debias_result as sc 


def fair(name, vanilla, lambda_=0.0, similarity=None):
    # vanilla result
    U = vanilla[name]['eigenvectors']
    print()

    # load dataset
    data = graph.read_mat(name)
    G = data['graph']
    cc = max(nx.connected_components(G), key=len)  # take largest connected components
    A = nx.to_scipy_sparse_matrix(G, nodelist=cc, dtype='float', format='csc')

    # build similarity matrix
    S = utils.get_similarity_matrix(A, metric=similarity)

    # debias spectral clustering
    start = time.perf_counter()
    U = sc.debias_result(U, S, lambda_)
    end = time.perf_counter()

    print('dataset: {}\t similarity: {}'.format(name, similarity))
    print('elapsed time: {} seconds'.format(end-start))
    print()

    return U



if __name__ == '__main__':
    lambda_ = 0.5

    with open('result/spectral/vanilla.pickle', 'rb') as f:
        vanilla = pickle.load(f)

    # jaccard index
    result = dict()
    result['ppi'] = fair('ppi', vanilla, lambda_=lambda_, similarity='jaccard')

    with open('result/spectral/result/jaccard.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)

    # cosine similarity    
    result = dict()
    result['ppi'] = fair('ppi', vanilla, lambda_=lambda_, similarity='cosine')

    with open('result/spectral/result/cosine.pickle', 'wb') as f:
        pickle.dump(result, f, protocol=pickle.HIGHEST_PROTOCOL)