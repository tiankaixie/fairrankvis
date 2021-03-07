#!/usr/bin/env python
import collections
import glob
import os
import os.path
from os.path import dirname

import networkx as nx
import random

BASE_PATH = dirname(os.path.abspath(__file__))


def parse_featname_line(line: str, data_name: str) -> (str, str, str):
    """
    For each line, extract feature name and corresponding values
    Args:
        line:
        data_name:

    Returns: (ego_feature_index, feature name, feature value)

    """
    if data_name == "twitter":
        ego_feature_index = line[:(line.find(' '))]
        line = line[(line.find(' ')) + 1:]  # chop first field
        # print(line)
        line.rstrip()
        line.strip()
        if "@" in line or "#" in line:
            return ego_feature_index, "tag", line
        split = line.split(":", 2)
        if len(split) == 1:
            return ego_feature_index, "tag", split[0]
        if len(split) == 2:
            # print("split into two parts")
            # print(split)
            if split[1] == "\n":
                return ego_feature_index, "tag", split[0]
            return ego_feature_index, split[0], split[1]
    elif data_name == "gplus":
        ego_feature_index = line[:(line.find(' '))]
        line = line[(line.find(' ')) + 1:]
        line.rstrip()
        line.strip()
        split_index = line.find(":")

        return ego_feature_index, line[:split_index], line[split_index + 1:]
    else:
        raise NameError("not supported data name")


def load_socialnet_data(data_name: str):
    path = os.path.join(BASE_PATH, "data", data_name)
    labels = {}
    network = nx.Graph()
    # build the index from data/*.featnames files
    featname_files = glob.iglob("%s/*.featnames" % (path,))
    temp_label_map = collections.defaultdict(dict)
    for featname_file_name in featname_files:
        ego_feature_map = collections.defaultdict(tuple)
        node_id = featname_file_name.split("/")[-1].split(".")[0]
        # print(node_id)
        featname_file = open(featname_file_name, 'r')
        for line in featname_file:
            ego_feature_index, name, value = parse_featname_line(line, data_name)
            # print("got kv pair >> %s: %s " % (name, value))
            ego_feature_map[int(ego_feature_index)] = (name, value)
        featname_file.close()

        egofeat_file = open("%s/%s.egofeat" % (path, node_id), 'r')
        # parse ego node
        network.add_node(node_id)
        try:
            ego_features = [int(x) for x in egofeat_file.readline().split(' ')]

            for index, ego_feature in enumerate(ego_features):
                # label name: gender
                label_n = ego_feature_map[index][0]
                # label value name: male
                label_vn = ego_feature_map[index][1]
                if ego_feature == 1:
                    # print(ego_feature_map[index])
                    if not label_n in labels:
                        labels[label_n] = {}
                        labels[label_n]["feature_type"] = "category"
                        labels[label_n]["map"] = {}

                    if label_n not in temp_label_map:
                        temp_label_map[label_n][label_vn] = 0
                    else:
                        if label_vn not in temp_label_map[label_n]:
                            temp_label_map[label_n][label_vn] = len(temp_label_map[label_n].keys())

                    labels[label_n]["map"][temp_label_map[label_n][label_vn]] = label_vn
                    network.nodes[node_id][label_n] = temp_label_map[label_n][label_vn]

            feat_file = open("%s/%s.feat" % (path, node_id), 'r')
            # parse neighboring nodes
            for line in feat_file:
                # featname_file.seek(0)
                split = [int(x) for x in line.split(' ')]
                node_id = split[0]
                features = split[1:]
                # print(len(features))
                network.add_node(node_id)
                for index, feature in enumerate(features):
                    # label name: gender
                    label_n = ego_feature_map[index][0]
                    # label value name: male
                    label_vn = ego_feature_map[index][1]
                    if feature == 1:
                        if not label_n in labels:
                            labels[label_n] = {}
                            labels[label_n]["feature_type"] = "category"
                            labels[label_n]["map"] = {}

                        if label_n not in temp_label_map:
                            temp_label_map[label_n][label_vn] = 0
                        else:
                            if label_vn not in temp_label_map[label_n]:
                                temp_label_map[label_n][label_vn] = len(temp_label_map[label_n].keys())

                        labels[label_n]["map"][temp_label_map[label_n][label_vn]] = label_vn
                        network.nodes[node_id][label_n] = temp_label_map[label_n][label_vn]

        except ValueError as verr:
            print("%s", (verr,))

    try:
        edge_file = open("%s/%s_combined.txt" % (path, data_name), 'r')
        for line in edge_file:
            # nodefrom nodeto
            split = [int(x) for x in line.split(" ")]
            node_from = split[0]
            node_to = split[1]
            network.add_edge(node_from, node_to)
    except OSError:
        pass
    # print(network)
    network = network.to_directed()
    components = sorted(nx.weakly_connected_components(network), key=len)
    # giant_component = max(nx.weakly_connected_components(network), key=len)
    giant = network.subgraph(components[-1])
    threshold = 1000
    sampled_nodes = random.sample(giant.nodes, threshold)
    sampled_graph = giant.subgraph(sampled_nodes)

    print("node size: %d", (len(list(sampled_graph.nodes()))),)
    print("edge size: %d", (len(list(sampled_graph.edges()))),)
    return sampled_graph, labels


if __name__ == '__main__':
    print("Running tests.")
    print("Loading network...")
    graph, labels = load_socialnet_data("gplus")
    print(graph)
    print("done.")

    # failures = 0
    #
    #
    # def test(actual, expected, test_name):
    #     global failures  # lol python scope
    #     try:
    #         print("testing {}...".format(test_name, ))
    #         assert actual == expected, "%s failed (%s != %s)!" % (test_name, actual, expected)
    #         print("{} passed ({} == {}).".format(test_name, actual, expected))
    #     except AssertionError as e:
    #         print(e)
    #         failures += 1
    #
    #
    # test(network.order(), 4039, "order")
    # test(network.size(), 88234, "size")
    # test(round(nx.average_clustering(network), 4), 0.6055, "clustering")
    # print("%d tests failed." % (failures,))
