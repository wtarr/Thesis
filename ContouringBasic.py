__author__ = 'William'

import numpy as np
from matplotlib import ticker
import matplotlib.pyplot as plt

x = np.arange(0, 5, 1) # 1 - 4 spaces of 1
y = np.arange(0, 5, 1)
xx, yy = np.meshgrid(x, y)

z = [[1, 2, 3, 4, 3],
     [2, 7, 8, 6, 2],
     [3, 7, 9, 7, 3],
     [1, 3, 6, 6, 3],
     [0, 1, 1, 3, 2]]

plt.grid()

plt.xticks([0, 1, 2, 3, 4])
plt.yticks([0, 1, 2, 3, 4])
cs = plt.contour(xx, yy, z, 1)
plt.clabel(cs, inline=1, fontsize=10)
plt.show()



