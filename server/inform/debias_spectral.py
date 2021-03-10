import utils

import numpy as np
import networkx as nx

from scipy.sparse import identity, diags
from scipy.sparse.csgraph import laplacian
from scipy.sparse.linalg import eigsh, svds


def debias_graph(A0, S, lambda_, ncluster=10, v0=None, maxiter=100, lr=0.1, tol=1e-6, logger=None):
    A = A0.copy().tocoo()
    row = A.row
    col = A.col
    A = A.tocsc()
    LS = laplacian(S)
    residual_prev, residual = np.inf, np.inf
    nedges = A.nnz
    for niter in range(maxiter):
        residual_prev = residual
        try:
            LA = laplacian(A)
            LA *= -1
            V, U = eigsh(LA, which='LM', k=ncluster, sigma=1.0, v0=v0)
            if logger is not None:
                logger.info('Finish eigen-decomposition.')
        except:
            return None
        X = U.copy()

        # calc low-rank structure
        try:
            for i in range(ncluster):
                ui = U[:, [i]]
                M = V[i] * identity(A.shape[0]) - LA
                UM, SigmaM, VtM = svds(M)  # VtM is the transpose of VM
                SigmaM_pinv = diags(np.divide(1.0, SigmaM))
                x = LS @ ui
                x = UM.T @ x
                x = SigmaM_pinv @ x
                x = VtM.T @ x  # this is equivalent to VM @ x
                X[:, [i]] = x
        except:
            break

        # iterate each edge to update gradient
        residual, idx, sfnorm = 0, 0, 0
        for idx in range(nedges):
            s, t = row[idx], col[idx]
            if s > t:
                continue
            if s != t:
                grad = 4 * (A[s, t] - A0[s, t]) + partial_grad_wrt_graph(X, U, s, t, lambda_) + partial_grad_wrt_graph(X, U, t, s, lambda_)
            else:
                grad = 2 * (A[s, t] - A0[s, t]) + partial_grad_wrt_graph(X, U, s, t, lambda_)
            if A[s, t] >= lr * grad:
                A[s, t] -= lr * grad
                residual += (grad ** 2)
                sfnorm += ((A[s, t] - A0[s, t]) ** 2)
                if s != t:
                    A[t, s] -= lr * grad
                    residual += (grad ** 2)
                    sfnorm += ((A[t, s] - A0[t, s]) ** 2)

        if np.sqrt(residual) < tol:
            return A
    return A


def partial_grad_wrt_graph(x, u, s, t, lambda_):
    partial_grad = lambda_ * (x[s, :] @ u[s, :] - x[s, :] @ u[t, :])
    return 2 * partial_grad


def debias_alg(A, S, lambda_, ncluster=10, v0=None):
    L = laplacian(A) + lambda_ * laplacian(S)
    L *= -1
    V, U = eigsh(L, which='LM', k=ncluster, sigma=1.0, v0=v0)
    return V, U
