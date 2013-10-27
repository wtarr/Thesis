__author__ = 'William'

import numpy as np
import matplotlib.pyplot as plt

x = np.arange(1, 5, 1) # 1 - 4 spaces of 1
y = np.arange(1, 5, 1)
xx, yy = np.meshgrid(x, y)

z = [[3, 6, 6, 3],
     [7, 9, 7, 3],
     [7, 8, 6, 2],
     [2, 3, 4, 3]]

plt.grid()
cs = plt.contour(xx, yy, z)
plt.clabel(cs, inline=1, fontsize=10)
plt.show()



