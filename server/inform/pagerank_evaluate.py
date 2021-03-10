import pickle
import json

import graph
import utils

import numpy as np

from scipy.sparse.csgraph import laplacian


def lp_diff(vr, fr, ord=None):
	diff = vr - fr
	return np.linalg.norm(diff, ord=ord)


def kl_divergence(vr, fr):
	nvr = np.sum(vr)
	nfr = np.sum(fr)
	kl = 0
	for i in range(vr.shape[0]):
		x = fr[i] / nfr
		y = vr[i] / nvr
		if y != 0 and x != 0:
			kl += x * np.log(x / y)
	return kl


def precision_at_k(vtopk, ftopk):
	topk = set(ftopk)
	groundtruth = set(vtopk)
	return len(topk.intersection(groundtruth)) / len(topk)


def calc_single_dcg(rel, pos):
	numerator = (2 ** rel) - 1
	denominator = np.log(1 + pos)
	return numerator / denominator


def ndcg_at_k(vtopk, ftopk):
	dcg, idcg = 0, 0
	for i in range(len(ftopk)):
		if ftopk[i] in vtopk:
			dcg += calc_single_dcg(1, i + 1)
		idcg += calc_single_dcg(1, i + 1)
	return dcg / idcg


def bias(name, similarity, vr, fr):
	# load graph
	data = graph.read_mat(name)
	A = data['adjacency']
	A = utils.symmetric_normalize(A)

	# build similarity matrix
	S = utils.filter_similarity_matrix(utils.get_similarity_matrix(A, metric=similarity), sigma=0.75)
	S = utils.symmetric_normalize(S)
	LS = laplacian(S)

	# calculate bias
	vbias = utils.trace(vr.T @ LS @ vr)
	fbias = utils.trace(fr.T @ LS @ fr)
	drop = 1 - (fbias/vbias)
	return vbias, fbias, drop


def main(name, similarity, task):
	# scores
	result = dict()

	# load vanilla result
	with open('result/pagerank/vanilla.pickle', 'rb') as f:
		vanilla = pickle.load(f)

	# load fair result
	with open('result/pagerank/{}/{}.pickle'.format(task, similarity), 'rb') as f:
		fair = pickle.load(f)

	# get vanilla and fair results
	vr = np.asarray(vanilla[name].todense()).flatten()  # vanilla result, flatten to np.array
	fr = np.asarray(fair[name].todense()).flatten()  # fair result, flatten to np.array

	# evaluate
	result[name] = dict()
	result[name]['l2'] = lp_diff(vr, fr, ord=2) / np.linalg.norm(vr, ord=2)
	result[name]['kl'] = kl_divergence(vr, fr)
	result[name]['precision'] = dict()
	result[name]['ndcg'] = dict()
	for k in [50]:
		vtopk = np.argsort(vr)[-k:][::-1]
		ftopk = np.argsort(fr)[-k:][::-1]
		result[name]['precision'][k] = precision_at_k(vtopk, ftopk)
		result[name]['ndcg'][k] = ndcg_at_k(vtopk, ftopk)
	result[name]['bias'] = bias(name, similarity, vanilla[name], fair[name])

	# save to file
	with open('result/pagerank/{}/eval_{}.json'.format(task, similarity), 'w') as f:
		json.dump(result, f, indent=4)


if __name__ == '__main__':
	main(name='ppi', similarity='jaccard', task='graph')
	main(name='ppi', similarity='cosine', task='graph')

	main(name='ppi', similarity='jaccard', task='alg')
	main(name='ppi', similarity='cosine', task='alg')

	main(name='ppi', similarity='jaccard', task='result')
	main(name='ppi', similarity='cosine', task='result')