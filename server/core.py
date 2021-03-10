import collections
import csv
import json
import os
import random
from math import sqrt
from os.path import dirname
from typing import List
from uuid import UUID
import re
from inform import debias_result as pagerank
import networkx as nx
import numpy as np
from node2vec import Node2Vec
from sklearn.manifold import MDS, TSNE
from scipy import sparse
import utils
from AttriRank import AttriRank
from facebook_util import load_facebook_data
from social_net_util import load_socialnet_data

BASE_PATH = dirname(os.path.abspath(__file__))


def load_polblogs(filter_threshold=0):
    """Load political blog data

    Args:
        filter_threshold (int): threshold to control the size of graph

    Returns:
        graph_object (networkx object): loaded networkx object
        label_dict_set (dict): a dict of labels

    """
    path = os.path.join(BASE_PATH, "data", "polblogs.gml")
    graph = nx.read_gml(path)
    # print(graph.nodes["100monkeystyping-com"])
    graph = graph.to_directed()
    # new_graph = sorted(nx.weakly_connected_components(graph), key=len, reverse=True)
    # new_graph = graph.subgraph(new_graph[0])
    new_graph = nx.DiGraph()
    for u, v, data in graph.edges(data=True):
        if graph.degree(u) >= filter_threshold and graph.degree(
                v) >= filter_threshold:
            if new_graph.has_edge(u, v):
                new_graph[u][v]['weight'] = 1.0
            else:
                new_graph.add_edge(u, v, weight=1.0)
    for node in list(new_graph.nodes):
        new_graph.nodes[node]["politicalStandpoint"] = 0 if graph.nodes[node]["value"] == 0 else 1
    return new_graph


def generate_random_feature(feature_type: str, feature_range: List[int]):
    if feature_type == "discrete":
        return random.randint(feature_range[0], feature_range[1])
    elif feature_type == "continuous":
        return random.uniform(feature_range[0], feature_range[1])
    else:
        raise NameError("Wrong type for feature type!")


def load_social_network(n: int = 400):
    graph = nx.gnm_random_graph(n=n, m=n * 3, seed=1)
    for node in list(graph.nodes):
        # male 0, female 1, other 2
        graph.nodes[node]["gender"] = generate_random_feature("discrete", [
            0, 2])
        # european, latino, african-american, asian, others
        graph.nodes[node]["race"] = generate_random_feature("discrete", [0, 7])
        # age
        graph.nodes[node]["age"] = generate_random_feature("discrete", [
            0, 5])
        #
        graph.nodes[node]["grade"] = generate_random_feature(
            "discrete", [0, 4])
        graph.nodes[node]["area"] = generate_random_feature("discrete", [0, 4])
        graph.nodes[node]["salary"] = generate_random_feature("discrete", [
            0, 4])
    return graph


def synthesis_biased_data():
    path = os.path.join(BASE_PATH, "data", "socfb-Haverford76.mtx")
    # matrix = mmread(path)
    graph = nx.DiGraph()
    np.random.seed(0)
    with open(path) as tsvfile:
        tsvreader = csv.reader(tsvfile, delimiter="\t")
        for index, line in enumerate(tsvreader):
            if index != 0 and index != 1:
                temp_split = line[0].split()
                graph.add_edge(int(temp_split[0]) - 1, int(temp_split[1]) - 1)
        for node in list(graph.nodes):
            # male 0, female 1, other 2
            graph.nodes[node]["gender"] = np.random.choice(
                3, 1, p=[0.45, 0.45, 0.1])[0]
            # european, latino, african-american, asian, others
            graph.nodes[node]["race"] = np.random.choice(
                8, 1, p=[0.15, 0.1, 0.1, 0.15, 0.15, 0.15, 0.1, 0.1])[0]
            # age
            graph.nodes[node]["age"] = np.random.choice(
                6, 1, p=[0.1, 0.2, 0.3, 0.1, 0.2, 0.1])[0]
            #
            graph.nodes[node]["grade"] = np.random.choice(
                5, 1, p=[0.2, 0.2, 0.3, 0.1, 0.2])[0]
            graph.nodes[node]["area"] = np.random.choice(
                5, 1, p=[0.4, 0.1, 0.1, 0.1, 0.3])[0]
            graph.nodes[node]["salary"] = np.random.choice(
                5, 1, p=[0.3, 0.2, 0.3, 0.1, 0.1])[0]
    # print(matrix.toarray())
    print("create biased profile")

    graph.nodes[0]["gender"] = 0
    graph.nodes[100]["gender"] = 0
    graph.nodes[269]["gender"] = 0
    graph.nodes[279]["gender"] = 0
    graph.nodes[668]["gender"] = 0
    graph.nodes[783]["gender"] = 0
    graph.nodes[1039]["gender"] = 0
    graph.nodes[1193]["gender"] = 0
    graph.nodes[1300]["gender"] = 0
    graph.nodes[1326]["gender"] = 0

    graph.nodes[0]["race"] = 0
    graph.nodes[100]["race"] = 1
    graph.nodes[269]["race"] = 1
    graph.nodes[279]["race"] = 1
    graph.nodes[668]["race"] = 1
    graph.nodes[783]["race"] = 1
    graph.nodes[1039]["race"] = 1
    graph.nodes[1193]["race"] = 1
    graph.nodes[1300]["race"] = 1
    graph.nodes[1326]["race"] = 4

    graph.nodes[0]["grade"] = 3
    graph.nodes[100]["grade"] = 3
    graph.nodes[269]["grade"] = 3
    graph.nodes[279]["grade"] = 3
    graph.nodes[668]["grade"] = 3
    graph.nodes[783]["grade"] = 3
    graph.nodes[1039]["grade"] = 3
    graph.nodes[1193]["grade"] = 4
    graph.nodes[1300]["grade"] = 4
    graph.nodes[1326]["grade"] = 4

    return graph


def load_labels(data_name: str) -> dict:
    if data_name == "karate":
        return {
            "club": {
                "feature_type": "category",
                "map": {
                    0: "Mr. Hi",
                    1: "Officer"
                }
            }
        }
    elif data_name == "polblogs":
        return {
            "politicalStandpoint": {
                "feature_type": "category",
                "map": {
                    0: "Liberal",
                    1: "Conservative"
                }
            }
        }
    elif data_name == "socialnet" or data_name == "synthesis":
        return {
            "gender": {
                "feature_type": "category",
                "map": {
                    0: "male",
                    1: "female",
                    2: "other"
                }
            },
            "race": {
                "feature_type": "category",
                "map": {
                    0: "American Indian/Alaska Native",
                    1: "Asian",
                    2: "Black/African American",
                    3: "Hispanic/Latino",
                    4: "Native Hawaiian/Other Pacific Islander",
                    5: "White",
                    6: "Two or more Races",
                    7: "Others"

                }
            },
            "age": {
                "feature_type": "category",
                "map": {
                    0: "under 18",
                    1: "19 - 25",
                    2: "26 - 35",
                    3: "36 - 45",
                    4: "45 - 60",
                    5: "above 60"
                }
            },
            "grade": {
                "feature_type": "category",
                "map": {
                    0: "under 2.0",
                    1: "2.0 - 2.9",
                    2: "3.0 - 3.5",
                    3: "3.5 - 3.9",
                    4: "4.0",
                }
            },
            "area": {
                "feature_type": "category",
                "map": {
                    0: "area 1",
                    1: "area 2",
                    2: "area 3",
                    3: "area 4",
                    4: "area 5",
                }
            },
            "salary": {
                "feature_type": "category",
                "map": {
                    0: "below $25000",
                    1: "$25000 to $60000",
                    2: "$60000 to $100000",
                    3: "$100000 to $200000",
                    4: "above $200000"
                }
            },
        }
    else:
        raise NameError("not supported data: %s", (data_name,))


def load_weibo() -> (type(nx), dict):
    graph = nx.DiGraph()
    node_path = os.path.join(BASE_PATH, "data/weibo", "train_labels.txt")
    edge_path = os.path.join(BASE_PATH, "data/weibo", "train_links.txt")
    # print(edge_path)
    node_file = open(node_path, "r")
    node_map = {}
    labels = {
        "gender": {
            "feature_type": "category",
            "map": {}
        },
        "age": {
            "feature_type": "category",
            "map": {}
        }

    }
    temp_label_map = {
        "gender": {},
        "age": {}
    }
    for line in node_file:
        node_info = line.split("||")
        node_id = node_info[0]
        gender = node_info[1]
        age = int(node_info[2])
        if age <= 1959:
            age = "before 1960"
        elif 1960 <= age <= 1969:
            age = "60s"
        elif 1970 <= age <= 1979:
            age = "70s"
        elif 1980 <= age <= 1989:
            age ="80s"
        elif 1990 <= age <= 1999:
            age = "90s"
        else:
            age = "00s"
        node_map[node_id] = {
            "gender": gender,
            "age": age
        }

    edge_file = open(edge_path, "r")
    count = 0
    for line in edge_file:
        friend_ids = line.split(" ")
        node_id = friend_ids[0]
        # print(len(friend_ids))
        if node_id not in node_map:
            continue
        # print(len(friend_ids))
        for i in range(1, len(friend_ids)):
            graph.add_edge(friend_ids[i], node_id)

    for node in node_map.keys():
        for feature in ["gender", "age"]:
            if node_map[node][feature] not in temp_label_map[feature]:
                temp_label_map[feature][node_map[node][feature]] = len(temp_label_map[feature].keys())
            labels[feature]["map"][temp_label_map[feature][node_map[node][feature]]] = node_map[node][feature]
            graph.add_node(node)
            graph.nodes[node][feature] = temp_label_map[feature][node_map[node][feature]]

    print(labels)

    threshold = 500
    sampled_nodes1 = random.sample(graph.nodes(), threshold)
    sampled_nodes2 = random.sample(node_map.keys(), threshold)
    sampled_nodes = list(set(sampled_nodes1 + sampled_nodes2))
    sampled_graph = graph.subgraph(sampled_nodes)

    return sampled_graph, labels


def load_weibo2() -> (type(nx), dict):
    graph = nx.DiGraph()
    node_path = os.path.join(BASE_PATH, "data/weibo", "weibo_user.csv")
    edge_path = os.path.join(BASE_PATH, "data/weibo", "follower_followee.csv")
    node_map = {}
    labels = {
        "gender": {
            "feature_type": "category",
            "map": {}
        },
        "level": {
            "feature_type": "category",
            "map": {}
        }
        ,
        "fans": {
            "feature_type": "category",
            "map": {}
        }
        ,
        "location": {
            "feature_type": "category",
            "map": {}
        }

    }
    temp_label_map = {
        "gender": {},
        "level": {},
        "fans": {},
        "location": {}
    }
    locations = {"河北": "Hebei", "山西": "Shanxi", "辽宁": "Liaoning", "吉林":"Jilin", "黑龙江":"Helongjiang", "江苏": "Jiangsu", "浙江":"Zhejiang", "安徽":"Anhui", "福建": "Fujian", "江西": "Jiangxi", "山东": "Shandong", "河南": "Henan", "湖北": "Hubei", "湖南": "Hunan", "广东": "Guangdong", "海南": "Hainan" , "四川": "Sichuan",
                 "贵州": "Guizhou", "云南": "Yunnan", "陕西": "Shanxi", "甘肃": "Gansu", "青海": "Qinghai", "台湾,": "Taiwan", "内蒙古": "Neimenggu", "广西": "Guangxi", "西藏": "Xizang", "宁夏": "Ningxia", "新疆": "Xinjiang", "北京": "Beijing", "天津": "Tianjin", "上海": "Shanghai", "重庆":"Chongqing", "其他": "Other", "海外": "Oversea"}
    count = 0
    with open(node_path, newline='') as csvfile:
        csvreader = csv.reader(csvfile, delimiter=',')
        for i, row in enumerate(csvreader):
            if i == 0: continue
            marked_place = False
            node_id = row[0]
            gender = row[3]
            level = row[4]
            message = row[5]
            message.strip()
            location = "other"
            message = re.split(r'\s{1,}', message)
            if len(message) == 0:
                pass
            else:
                if message[0] in locations:
                    location = locations[message[0]]
                    count += 1
                    marked_place = True
                    print(location)
                if message[0][:2] in locations:
                    location = locations[message[0][:2]]
                    count += 1
                    marked_place = True
                    print(location)
                if message[0][:3] in locations:
                    location = locations[message[0][:3]]
                    count += 1
                    marked_place = True
                    print(location)
            if len(message) <= 1:
                pass
            else:
                if message[1] in locations:
                    location = locations[message[1]]
                    count += 1
                    marked_place = True
                    print(location)
                if message[1][:2] in locations:
                    location = locations[message[1][:2]]
                    count += 1
                    marked_place = True
                    print(location)
                if message[1][:3] in locations:
                    location = locations[message[1][:3]]
                    count += 1
                    marked_place = True
                    print(location)
            if len(message) <= 2:
                pass
            else:
                if message[2] in locations:
                    location = locations[message[2]]
                    count += 1
                    marked_place = True
                    print(location)
                if message[2][:2] in locations:
                    location = locations[message[2][:2]]
                    count += 1
                    marked_place = True
                    print(location)
                if message[2][:3] in locations:
                    location = locations[message[2][:3]]
                    count += 1
                    marked_place = True
                    print(location)
            if not marked_place:
                print(node_id + "@@@")
                print(message)
            fans = str(row[7])
            if len(fans) < 4:
                fans = "under 10k"
            elif len(fans) < 7:
                fans = "10k to 1M"
            elif len(fans) < 8:
                fans = "1M to 10M"
            else:
                fans = "above 10M"

            node_map[node_id] = {
                "gender": gender,
                "level": level,
                "fans": fans,
                "location": location
            }
    print(count)
    with open(edge_path) as csvfile:
        csvreader = csv.reader(csvfile, delimiter=',')
        for i, row in enumerate(csvreader):
            if i == 0: continue
            follower_id = row[2]
            followee_id = row[4]
            if followee_id in node_map and follower_id in node_map:
                graph.add_edge(follower_id, followee_id)

    for node in node_map.keys():
        for feature in ["gender", "level", "fans", "location"]:
            if node_map[node][feature] not in temp_label_map[feature]:
                temp_label_map[feature][node_map[node][feature]] = len(temp_label_map[feature].keys())
            labels[feature]["map"][temp_label_map[feature][node_map[node][feature]]] = node_map[node][feature]
            graph.add_node(node)
            graph.nodes[node][feature] = temp_label_map[feature][node_map[node][feature]]

    print(len(list(graph.nodes())))
    print(len(list(graph.edges())))

    return graph, labels


def load_data(data_name: str) -> (type(nx), dict):
    """
    Load data based on data name.
    Args:
        data_name: data name

    Returns:
        graph data, labels
    """
    if data_name == "karate":
        return nx.karate_club_graph(), load_labels(data_name)
    elif data_name == "polblogs":
        return load_polblogs(), load_labels(data_name)
    elif data_name == "socialnet":
        return load_social_network(), load_labels(data_name)
    elif data_name == "synthesis":
        return synthesis_biased_data(), load_labels(data_name)
    elif data_name == "facebook":
        return load_facebook_data()
    elif data_name == "gplus":
        return load_socialnet_data("gplus")
    elif data_name == "weibo":
        return load_weibo2()
    else:
        raise NameError("Cannot find data: s%", (data_name,))


def graph_mining(model_name: str, data: type(nx), labels: dict) -> dict:
    res = {}
    if model_name == "pagerank":
        init_res = nx.pagerank(data)
        for key in init_res.keys():
            res[key] = {"res": init_res[key]}
    elif model_name == "hits":
        _, init_res = nx.hits(data)
        for key in init_res.keys():
            res[key] = {"res": init_res[key]}
    elif model_name == "node2vec":
        # Precompute probabilities and generate walks - **ON WINDOWS ONLY WORKS WITH workers=1**
        # Use temp_folder for big graphs
        node2vec = Node2Vec(data, dimensions=64,
                            walk_length=30, num_walks=200, workers=8)

        init_res = node2vec.fit(window=10, min_count=1, batch_words=4)
        for node in list(data.nodes):
            res[node] = {"res": init_res.wv[str(node)]}
            print(init_res.wv[str(node)])
    elif model_name == "attrirank":
        graph = []
        feat = []
        for index, edge in enumerate(list(data.edges())):
            graph.append([edge[0], edge[1]])

        for index, node in enumerate(list(data.nodes())):
            temp_array = []
            for key in labels.keys():
                if key not in data.nodes[node]:
                    temp_array.append(-1)
                else:
                    temp_array.append(data.nodes[node][key])
            feat.append(temp_array)

        graph = np.array(graph)
        feat = np.array(feat)
        # print(np.array(graph))
        # print(np.array(feat))

        if not nx.is_directed(data):
            graph = np.concatenate((graph, graph[:, [1, 0]]))

        # scores = AR.runModel(factors=args.damp, kernel=args.kernel,
        #                     Matrix=args.matrix, TotalRank=args.totalrank,
        #                     alpha=args.alpha, beta=args.beta,
        #                     print_every=args.print_every)
        scores = AttriRank(graph, feat, nodeCount=len(data.nodes()),
                           adjacency_matrix=nx.adjacency_matrix(data).todense()).runModel()
        # print(scores)
        rank_index = sorted(range(len(scores["0.85"])), key=lambda k: scores["0.85"][k], reverse=True)
        graph_nodes = list(data.nodes)
        for index, node in enumerate(graph_nodes):
            res[node] = {"res": scores["0.85"][index]}

        for rank, i in enumerate(rank_index):
            res[graph_nodes[i]]["rank"] = rank + 1
    elif model_name == "inform":
        r = nx.pagerank(data)
        # print(np.array(list(r.values())))
        print(sparse.csr_matrix(np.array(list(r.values()))))
        # load dataset
        A = utils.symmetric_normalize(nx.to_scipy_sparse_matrix(data, dtype='float', format='csc'))
        pre_r = sparse.csr_matrix(np.array(list(r.values())))
        print(pre_r)
        # build similarity matrix
        S = utils.filter_similarity_matrix(utils.get_similarity_matrix(A, metric="cosine"), sigma=0.75)
        S = utils.symmetric_normalize(S)
        print(S.shape)
        print(pre_r.shape)
        r = pagerank.debias_result(pre_r.transpose(), S, 0.5)
        graph_nodes = list(data.nodes)
        r = r.toarray().reshape(-1)
        print(r[0])
        for index, node in enumerate(graph_nodes):
            res[node] = {"res": r[index]}
        rank_index = sorted(range(len(r)), key=lambda k: r[k], reverse=True)
        for rank, i in enumerate(rank_index):
            res[graph_nodes[i]]["rank"] = rank + 1
    elif model_name == "other":
        pass
    else:
        raise NameError("No such model currently supported: " + model_name)
    return res


def input_similarity(individual_sim, data) -> object:
    """Calculate individual similarity

    Args:
        individual_sim (str): name of similarity metric
        data (networkx graph): input data 

    Returns:
        object: similarity matrix
            - id pair
                - sim value
    """
    mds = MDS()
    if individual_sim == "cosine" or individual_sim == "jaccard":
        adj = utils.symmetric_normalize(nx.to_scipy_sparse_matrix(data, dtype='float', format='csc'))
        sim = utils.get_similarity_matrix(adj, metric=individual_sim)
        sim = np.array(1 - sim.toarray())
        mds.fit(sim)
        return mds.embedding_

    elif individual_sim == "pagerank":
        nodes = list(data.nodes())
        init_res = nx.pagerank(data)
        similarity_matrix = [[float("inf") for _ in range(
            len(nodes))] for _ in range(len(nodes))]
        for i in range(len(nodes)):
            for j in range(len(nodes)):
                similarity_matrix[i][j] = abs(init_res[nodes[i]] - init_res[nodes[j]])
        mds.fit(similarity_matrix)
        return mds.embedding_
    else:
        raise NameError("No individual similarity given for: " + individual_sim)


def topological_feature(data: type(nx)) -> dict:
    pr_map = collections.defaultdict(dict)
    nodes = list(data.nodes())
    prv = nx.pagerank(data)
    rank_index = sorted(range(len(nodes)), key=lambda k: prv[nodes[k]], reverse=True)
    for rank, i in enumerate(rank_index):
        pr_map[nodes[i]]["score"] = prv[nodes[i]]
        pr_map[nodes[i]]["rank"] = rank + 1
    return {"pagerank": pr_map}


def stat(lst):
    """Calculate mean and std deviation from the input list."""
    n = float(len(lst))
    mean = sum(lst) / n
    stdev = sqrt((sum(x * x for x in lst) / n) - (mean * mean))
    return mean, stdev


def clustering(mins_bucket, res_array, nodes):
    clusters = {}
    for index, res in enumerate(res_array):
        for i in range(len(mins_bucket)):
            if res < mins_bucket[i]:
                clusters[nodes[index]] = i
                break
            elif i == len(mins_bucket) - 1:
                clusters[nodes[index]] = i + 1
                break
    return clusters


def output_similarity(res: dict) -> list:
    if len(res.keys()) > 0 and not isinstance(list(res.values())[0]["res"], list):
        return []
    res_values = [item["res"] for item in res.values()]
    res_values = np.array(res_values)

    return TSNE(n_components=2, verbose=1, perplexity=40, n_iter=300).fit_transform(res_values)


def common_matrix(data) -> dict:
    nodes = list(data.nodes())
    res_matrix = [[0 for _ in range(len(nodes))] for _ in range(len(nodes))]
    common_neighbor_matrix = [[0 for _ in range(len(nodes))] for _ in range(len(nodes))]
    temp_g = data.to_undirected()
    # pagerank
    pr = nx.pagerank_numpy(data)
    for i in range(len(nodes)):
        for j in range(len(nodes)):
            if i != j:
                # common neighbors
                common_list = list(nx.common_neighbors(
                    temp_g, nodes[i], nodes[j]))
                common_neighbor_matrix[i][j] = len(common_list)
                # pagerank
                res_matrix[i][j] = abs(
                    pr[nodes[i]] - pr[nodes[j]])

        common_neighbor_matrix[i][i] = 0
        res_matrix[i][i] = 0
    # cosine
    A = utils.symmetric_normalize(nx.to_scipy_sparse_matrix(data, dtype='float', format='csc'))
    cosine_matrix = utils.get_similarity_matrix(A, metric="cosine")
    cosine_matrix = np.array(1 - cosine_matrix.toarray())
    return {"pagerank": res_matrix,
            "commonNeightbor": common_neighbor_matrix,
            "cosine": cosine_matrix}


class CoreEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, UUID):
            # if the obj is uuid, we simply return the value of uuid
            return obj.hex
        else:
            return obj.__dict__


class Core:
    def __init__(self, config: dict):
        """Data automation

        Args:
            config.data_name: str Name of the data
            config.individual_sim: dict Individual similarity consideration
            config.individual_res_sim: dict Individual similarity mining result consideration
            config.model_name: str Name of the mining model

        """
        print("[1/4] load_data")
        self.data, self.labels = load_data(data_name=config["data_name"])
        print(self.data)
        print("[2/4] graph_mining")
        self.mining_res = graph_mining(
            model_name=config["model_name"], data=self.data, labels=self.labels)
        print("[3/4] output sim")
        self.clusters = output_similarity(res=self.mining_res)
        print("[4/4] topological features")
        self.topological_feature = topological_feature(data=self.data)
        print("core initialization finished")
