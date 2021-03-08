
import os
import sys
from os.path import dirname, abspath
sys.path.append(dirname(dirname(abspath(__file__))))
from core import Core, CoreEncoder
import networkx as nx
from scipy.interpolate import interp1d
import numpy as np
import json
from core import load_data

def generate_cache_data(config):
    """Generate the cached data for visualization

    Args:
        config (dict): configuration
    """
    
    print(f'Preprocessing the data [{config["data_name"]}] [{config["model_name"]}] [{config["individual_sim"]}]...')
    print("core loading... ")
    core = Core(config=config)

    ###################################################################
    # overview data file format
    ###################################################################
    # layout = nx.nx.spring_layout(core.data)
    # overview_m = interp1d([-1, 1], [0, 200])
    #
    # scatter_m = interp1d([np.min(core.input_similarity), np.max(core.input_similarity)],[0,200])

    nodes = {}
    for index, node in enumerate(list(core.data.nodes())):
        # nodes[node] = {"id": node, "x": overview_m(layout[node][0]), "y": overview_m(layout[node][1]), "sim_x": scatter_m(core.input_similarity[index][0]), "sim_y": scatter_m(core.input_similarity[index][1])}
        nodes[node] = {"id": str(node)}
        for key in core.labels.keys():
            if key not in core.data.nodes[node]:
                nodes[node][key] = -1
            else:
                nodes[node][key] = core.data.nodes[node][key]
    edges = {}
    for edge in list(core.data.edges()):
        edge_id = str(edge[0]) + "~" + str(edge[1])
        edges[edge_id] = {"source": edge[0], "target": edge[1]}
        
    core_output = {
        "config": config,
        "input": {
            "labels": core.labels,
            "nodes": nodes,
            "edges": edges,
            # "common_matrix": core.common_matrix
            "topological_feature": core.topological_feature
        },
        "output": {
            "res": core.mining_res,
            "similarity": core.clusters
        }
    }
    with open(
        "cached_data/" + config["data_name"] + "_" + config["model_name"] + "_" + config["individual_sim"] + ".json",
            "w") as jf:
        json.dump(core_output, jf, cls=CoreEncoder)

    print("data cached.")


def generate_attrirank_input(data_name):
    """Generate input data for attrirank algorithm
    """
    graph, labels = load_data(data_name)
    with open("cached_data/" + data_name + "_graph.edgelist", "w") as f:
        for edge in graph.edges():
            f.write(str(edge[0]) + " " + str(edge[1]) + "\n")
    
    with open("cached_data/" + data_name + "_graph.feature", "w") as f:
        for index, node in enumerate(list(graph.nodes())):
            temp_str = str(node) + ","
            for id, key in enumerate(labels.keys()):
                if id == len(labels.keys()) - 1:
                    temp_str += str(graph.nodes[node][key])
                else:
                    temp_str += str(graph.nodes[node][key]) + ","
            f.write(temp_str+"\n")
    
        


if __name__ == "__main__":
    config = {
        "data_name" : "weibo",
        "model_name": "attrirank",
        "individual_sim": "pagerank"
    }
    generate_cache_data(config=config)
    # generate_attrirank_input("synthesis")
