import pickle
import json
import itertools

import graph
import utils

import numpy as np
import networkx as nx

from scipy.sparse.csgraph import laplacian
from sklearn.metrics import auc, f1_score, precision_recall_curve, roc_auc_score


def lp_diff(vr, fr, ord=None):
	diff = vr - fr
	return np.linalg.norm(diff, ord=ord)


def get_score(embs, node1, node2):
	vector1 = embs[int(node1)]
	vector2 = embs[int(node2)]
	return np.dot(vector1, vector2) / (np.linalg.norm(vector1) * np.linalg.norm(vector2))


def link_prediction(data, embeddings):
	true_edges = data['test_edge_pos']
	false_edges = data['test_edge_neg']

	true_list = list()
	prediction_list = list()
	for edge in true_edges:
		true_list.append(1)
		prediction_list.append(get_score(embeddings, edge[0], edge[1]))

	for edge in false_edges:
		true_list.append(0)
		prediction_list.append(get_score(embeddings, edge[0], edge[1]))

	sorted_pred = prediction_list[:]
	sorted_pred.sort()
	threshold = sorted_pred[-len(true_edges)]

	ypred = np.zeros(len(prediction_list), dtype=np.int32)
	for i in range(len(prediction_list)):
		if prediction_list[i] >= threshold:
			ypred[i] = 1

	ytrue = np.array(true_list)
	yscores = np.array(prediction_list)
	ps, rs, _ = precision_recall_curve(ytrue, yscores)
	return roc_auc_score(ytrue, yscores), f1_score(ytrue, ypred), auc(rs, ps)


def bias(data, similarity, vr, fr):
	biases = dict()
	# load graph
	Atrain = data['adjacency_train']
	# build similarity matrix
	S = utils.filter_similarity_matrix(utils.get_similarity_matrix(Atrain, metric=similarity), sigma=0.75)
	LS = laplacian(S)

	# calculate training bias
	biases['train'] = [utils.trace(vr.T @ LS @ vr), utils.trace(fr.T @ LS @ fr)]
	drop = 1 - (biases['train'][1] / biases['train'][0])
	biases['train'].append(drop)

	valbias = [0, 0]  # first one is vanilla, second one is fair
	# calculating bias on validation set
	for edge in data['val_edge_pos']:
		vedgebias = (lp_diff(vr[edge[0]], vr[edge[1]], ord=2) ** 2) * S[edge[0], edge[1]]
		fedgebias = (lp_diff(fr[edge[0]], fr[edge[1]], ord=2) ** 2) * S[edge[0], edge[1]]
		valbias[0] += vedgebias
		valbias[1] += fedgebias
	for edge in data['val_edge_neg']:
		vedgebias = (lp_diff(vr[edge[0]], vr[edge[1]], ord=2) ** 2) * S[edge[0], edge[1]]
		fedgebias = (lp_diff(fr[edge[0]], fr[edge[1]], ord=2) ** 2) * S[edge[0], edge[1]]
		valbias[0] += vedgebias
		valbias[1] += fedgebias
	drop = 1 - (valbias[1] / valbias[0])
	valbias.append(drop)
	biases['validation'] = valbias

	# calculating bias on test set
	testbias = [0, 0]  # first one is vanilla, second one is fair
	for edge in data['test_edge_pos']:
		vedgebias = (lp_diff(vr[edge[0]], vr[edge[1]], ord=2) ** 2) * S[edge[0], edge[1]]
		fedgebias = (lp_diff(fr[edge[0]], fr[edge[1]], ord=2) ** 2) * S[edge[0], edge[1]]
		testbias[0] += vedgebias
		testbias[1] += fedgebias
	for edge in data['test_edge_neg']:
		vedgebias = (lp_diff(vr[edge[0]], vr[edge[1]], ord=2) ** 2) * S[edge[0], edge[1]]
		fedgebias = (lp_diff(fr[edge[0]], fr[edge[1]], ord=2) ** 2) * S[edge[0], edge[1]]
		testbias[0] += vedgebias
		testbias[1] += fedgebias
	drop = 1 - (testbias[1] / testbias[0])
	testbias.append(drop)
	biases['test'] = testbias

	return biases


def main(name, similarity, task):
	# scores
	result = dict()

	# load vanilla result
	with open('result/line/vanilla.pickle', 'rb') as f:
		vanilla = pickle.load(f)

	# load fair result
	with open('result/line/{}/{}.pickle'.format(task, similarity), 'rb') as f:
		fair = pickle.load(f)

	# load link prediction data
	data = graph.read_pickle(name)

	# get vanilla and fair results
	vr = vanilla[name]
	fr = fair[name]
			
	# evaluate
	result[name] = dict()
	result[name]['fro'] = lp_diff(vr, fr, ord='fro') / np.linalg.norm(vr, ord='fro')
	vanilla_result = link_prediction(data, vr)
	fair_result = link_prediction(data, fr)
	result[name]['roc-auc'] = vanilla_result[0], fair_result[0]
	result[name]['f1'] = vanilla_result[1], fair_result[1]
	result[name]['pr-auc'] = vanilla_result[2], fair_result[2]
	result[name]['bias'] = bias(data, similarity, vr, fr)

	# save to file
	with open('result/line/{}/eval_{}.json'.format(task, similarity), 'w') as f:
		json.dump(result, f, indent=4)


if __name__ == '__main__':
	main(name='ppi', similarity='jaccard', task='graph')
	main(name='ppi', similarity='cosine', task='graph')

	main(name='ppi', similarity='jaccard', task='alg')
	main(name='ppi', similarity='cosine', task='alg')

	main(name='ppi', similarity='jaccard', task='result')
	main(name='ppi', similarity='cosine', task='result')
