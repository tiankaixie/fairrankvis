import utils

from scipy.sparse import identity
from scipy.sparse.csgraph import laplacian


def matrix_conjugate_gradient(A, B, X, tol=1e-12, maxiter=100):
    if maxiter is None:
        maxiter = X.shape[0] * 10

    R = B - A @ X
    P = R.copy()
    for niter in range(maxiter):
        residual_prev = utils.trace(R.T @ R)
        alpha = residual_prev / utils.trace(P.T @ A @ P)
        X = X + alpha * P
        R = R - alpha * A @ P
        residual = utils.trace(R.T @ R)
        if residual < tol:
            return X
        beta = residual / residual_prev
        P = R + beta * P
    return X


def debias_result(Y, S, lambda_):
    if lambda_ == 0:
        return Y

    L_S = laplacian(S)
    A = identity(S.shape[0]) + lambda_ * L_S
    B = Y
    X = Y.copy()
    return matrix_conjugate_gradient(A, B, X)
