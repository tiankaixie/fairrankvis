import pickle
import json

import graph
import utils

import numpy as np
import networkx as nx

from scipy.sparse.csgraph import laplacian
from sklearn.cluster import KMeans
from sklearn.metrics import normalized_mutual_info_score


def lp_diff(vr, fr, norm=None):
	diff = 0
	if norm == 'fro':
		for i in range(vr.shape[1]):
			residual = min(np.linalg.norm(vr[:, i] + fr[:, i], ord=2), np.linalg.norm(vr[:, i] - fr[:, i], ord=2))
			diff += (residual ** 2)
		return np.sqrt(diff)
	else:
		diff = vr - fr
		return np.linalg.norm(diff, ord=norm)


def nmi(vr, fr, seed=0):
	# kmeans for vanilla spectral clustering
	vkmeans = KMeans(n_clusters=vr.shape[1], random_state=seed, n_init=1).fit(vr)
	vlabels = vkmeans.labels_

	# kmeans for fair spectral clustering
	fkmeans = KMeans(n_clusters=fr.shape[1], random_state=seed, n_init=1).fit(fr)
	flabels = fkmeans.labels_

	# calculate normalized mutual information
	nmi = normalized_mutual_info_score(vlabels, flabels, average_method='arithmetic')
	return nmi


def bias(name, similarity, vr, fr):
	# load graph
	data = graph.read_mat(name)
	G = data['graph']
	cc = max(nx.connected_components(G), key=len)  # take largest connected components
	A = nx.to_scipy_sparse_matrix(G, nodelist=cc, dtype='float', format='csc')

	# build similarity matrix
	S = utils.get_similarity_matrix(A, metric=similarity)
	LS = laplacian(S)

	# calculate bias
	vbias = utils.trace(vr.T @ LS @ vr)  # vanilla bias
	fbias = utils.trace(fr.T @ LS @ fr)  # fair bias
	reduce = 1 - (fbias / vbias)
	return vbias, fbias, reduce


def main(name, similarity, task):
	# scores
	result = dict()

	# load vanilla result
	with open('result/spectral/vanilla.pickle', 'rb') as f:
		vanilla = pickle.load(f)

	# load fair result
	with open('result/spectral/{}/{}.pickle'.format(task, similarity), 'rb') as f:
		fair = pickle.load(f)

	# get vanilla and fair results
	vr = vanilla[name]['eigenvectors']
	fr = fair[name]
			
	# evaluate
	result[name] = dict()
	result[name]['fro'] = lp_diff(vr, fr, norm='fro') / np.linalg.norm(vr, ord='fro')
	max_val = -1
	for seed in range(21):
		val = nmi(vr, fr, seed=seed)
		if val > max_val:
			max_val = val
		result[name]['nmi'] = max_val
		result[name]['bias'] = bias(name, similarity, vr, fr)

	# save to file
	with open('result/spectral/{}/eval_{}.json'.format(task, similarity), 'w') as f:
		json.dump(result, f, indent=4)


if __name__ == '__main__':
	main(name='ppi', similarity='jaccard', task='graph')
	main(name='ppi', similarity='cosine', task='graph')

	main(name='ppi', similarity='jaccard', task='alg')
	main(name='ppi', similarity='cosine', task='alg')

	main(name='ppi', similarity='jaccard', task='result')
	main(name='ppi', similarity='cosine', task='result')
