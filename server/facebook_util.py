#!/usr/bin/env python
import collections
import glob
import os
import os.path
from os.path import dirname

import networkx as nx
import numpy as np

pathhack = os.path.dirname(os.path.realpath(__file__))
BASE_PATH = dirname(os.path.abspath(__file__))
path = os.path.join(BASE_PATH, "data", "facebook")

feat_file_name = "%s/feature_map.txt" % (path,)
feature_index = {}  # numeric index to name
inverted_feature_index = collections.defaultdict(list)  # name to numeric index
network = nx.Graph()
ego_nodes = []


def parse_featname_line(line):
    line = line[(line.find(' ')) + 1:]  # chop first field
    split = line.split(';')
    name = ';'.join(split[:-1])  # feature name
    index = int(split[-1].split(" ")[-1])  # feature index
    return index, name


def load_features():
    # may need to build the index first
    if not os.path.exists(feat_file_name):
        feat_index = {}
        # build the index from data/*.featnames files
        featname_files = glob.iglob("%s/*.featnames" % (path,))
        for featname_file_name in featname_files:
            featname_file = open(featname_file_name, 'r')
            for line in featname_file:
                # example line:
                # 0 birthday;anonymized feature 376
                index, name = parse_featname_line(line)
                feat_index[index] = name
            featname_file.close()
        keys = feat_index.keys()
        keys.sort()
        out = open(feat_file_name, 'w')
        for key in keys:
            out.write("%d %s\n" % (key, feat_index[key]))
        out.close()

    # index built, read it in (even if we just built it by scanning)
    global feature_index
    global inverted_feature_index
    index_file = open(feat_file_name, 'r')
    for line in index_file:
        split = line.strip().split(' ')
        key = int(split[0])
        val = split[1]
        feature_index[key] = val
    index_file.close()

    for key in feature_index.keys():
        val = feature_index[key]
        inverted_feature_index[val].append(key)


def load_nodes():
    assert len(feature_index) > 0, "call load_features() first"
    global network
    global ego_nodes
    global inverted_feature_index

    # get all the node ids by looking at the files
    ego_nodes = [int(x.split("/")[-1].split('.')[0]) for x in glob.glob("%s/*.featnames" % (path,))]
    node_ids = ego_nodes

    # parse each node
    for node_id in node_ids:
        featname_file = open("%s/%d.featnames" % (path, node_id), 'r')
        feat_file = open("%s/%d.feat" % (path, node_id), 'r')
        egofeat_file = open("%s/%d.egofeat" % (path, node_id), 'r')
        edge_file = open("%s/%d.edges" % (path, node_id), 'r')

        # parse ego node
        network.add_node(node_id)
        # 0 1 0 0 0 ...
        ego_features = [int(x) for x in egofeat_file.readline().split(' ')]
        i = 0
        network.nodes[node_id]['features'] = np.zeros(len(feature_index))
        for line in featname_file:
            key, val = parse_featname_line(line)
            network.nodes[node_id]['features'][key] = ego_features[i] + 1
            i += 1

        # parse neighboring nodes
        for line in feat_file:
            featname_file.seek(0)
            split = [int(x) for x in line.split(' ')]
            node_id = split[0]
            features = split[1:]
            network.add_node(node_id)
            network.nodes[node_id]['features'] = np.zeros(len(feature_index))
            i = 0
            for line in featname_file:
                key, val = parse_featname_line(line)
                network.nodes[node_id]['features'][key] = features[i]
                i += 1

        featname_file.close()
        feat_file.close()
        egofeat_file.close()
        edge_file.close()


def load_edges():
    global network
    assert network.order() > 0, "call load_nodes() first"
    edge_file = open("%s/facebook_combined.txt" % (path,), "r")
    for line in edge_file:
        # nodefrom nodeto
        split = [int(x) for x in line.split(" ")]
        node_from = split[0]
        node_to = split[1]
        network.add_edge(node_from, node_to)


def load_network():
    """
    Load the network.  After calling this function, facebook.network points to a networkx object for the facebook data.

    """
    load_features()
    load_nodes()
    load_edges()


def feature_matrix():
    n_nodes = network.number_of_nodes()
    n_features = len(feature_index)

    X = np.zeros((n_nodes, n_features))
    for i, node in enumerate(network.nodes()):
        X[i, :] = network.node[node]['features']

    return X


def universal_feature(feature_index):
    """
    Does every node have this feature?

    """
    return len(
        [x for x in network.nodes_iter() if network.node[x]['features'][feature_index] > 0]) // network.order() == 1


def load_facebook_data():
    load_network()
    # print(feature_index)
    filter_threshold = 150
    feature_dict = {}
    graph = network.to_directed()
    global inverted_feature_index
    new_graph = nx.DiGraph()
    labels = []
    for label in inverted_feature_index.keys():
        if len(inverted_feature_index[label]) < 100:
            labels.append(label)
    giant_component = max(nx.weakly_connected_components(graph), key=len)
    for u, v, data in graph.edges(data=True):
        if graph.degree(u) >= filter_threshold and graph.degree(
                v) >= filter_threshold and u in giant_component and v in giant_component:
            if new_graph.has_edge(u, v):
                new_graph[u][v]['weight'] = 1.0
            else:
                new_graph.add_edge(u, v, weight=1.0)

    temp_label_index_in_order = collections.defaultdict(int)
    temp_label_set = collections.defaultdict(set)
    for node in new_graph.nodes():
        for label in labels:
            label = label.replace(";", "~")
            feature_index = - 1
            label_feature_map = {}
            for index in inverted_feature_index[label]:
                if network.nodes[node]["features"][index] >= 1:

                    feature_index = index
                label_feature_map[index] = "feature" + str(index)

            new_graph.nodes[node][label] = feature_index

            feature_dict[label] = {
                "feature_type": "category",
                "map": label_feature_map
            }
    return new_graph, feature_dict


if __name__ == '__main__':
    print("Running tests.")
    print("Loading network...")
    load_network()
    print("done.")

    failures = 0


    def test(actual, expected, test_name):
        global failures  # lol python scope
        try:
            print("testing {}...".format(test_name, ))
            assert actual == expected, "%s failed (%s != %s)!" % (test_name, actual, expected)
            print("{} passed ({} == {}).".format(test_name, actual, expected))
        except AssertionError as e:
            print(e)
            failures += 1


    test(network.order(), 4039, "order")
    test(network.size(), 88234, "size")
    test(round(nx.average_clustering(network), 4), 0.6055, "clustering")
    print("%d tests failed." % (failures,))
