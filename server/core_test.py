import os
import sys
import networkx as nx
import matplotlib.pyplot as plt
from os.path import dirname, abspath
sys.path.append(dirname(dirname(abspath(__file__))))

from core import Core, load_polblogs

if __name__ == '__main__':
    config = {
        "data_name" : "weibo",
        "model_name": "inform",
        "individual_sim": "pagerank"
    }
    core = Core(config=config)
    print(len(core.data.nodes()))
    # nx.draw(core.data, pos=nx.spring_layout(core.data))
    # plt.show()
    # print(core.common_matrix)
    pass
    # for line in list(test_core.mining_res):
    #     print(line)
    # load_polblogs()
    

