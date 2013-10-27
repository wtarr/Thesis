__author__ = 'William'
import Image

im = Image.open("sprite.bmp")
inew = Image.new("P", (16, 16))

wnew, hnew = inew.size

pixelsnew = inew.load()

for x in range(wnew):
    for y in range(hnew):
        pixelsnew[x, y] = 255

pixels = im.load()

w, h = im.size

x = 0
y = 10
white = 255
black = 0
path = []

skip = 0

while True:
    x0p = pixels[x, y]
    y0p = pixels[x + 1, y]
    x1p = pixels[x, y + 1]
    y1p = pixels[x + 1, y + 1]

    if (x0p is white and y0p is white and x1p is white and y1p is white) or \
            (x0p is black and y0p is black and x1p is white and y1p is white) or \
            (x0p is black and y0p is black and x1p is black and y1p is white) or \
            (x0p is white and y0p is black and x1p is white and y1p is white):
        if x+2 < w:
            x += 1  # go right
        pixelsnew[x, y] = 127
    elif (x0p is white and y0p is white and x1p is black and y1p is black) or \
            (x0p is white and y0p is black and x1p is black and y1p is black) or \
            (x0p is white and y0p is black and x1p is black and y1p is white) or \
            (x0p is white and y0p is white and x1p is black and y1p is white):
        if x-1 >= 0:
            x -= 1  # go left
        pixelsnew[x, y] = 127
    elif (x0p is black and y0p is white and x1p is white and y1p is white) or \
            (x0p is black and y0p is white and x1p is black and y1p is black) or \
            (x0p is black and y0p is white and x1p is black and y1p is white) or \
            (x0p is black and y0p is white and x1p is white and y1p is black):
        if y - 1 >= 0:
            y -= 1  # go up
        pixelsnew[x, y] = 127
    elif (x0p is white and y0p is black and x1p is white and y1p is black) or \
            (x0p is white and y0p is white and x1p is white and y1p is black) or \
            (x0p is black and y0p is black and x1p is white and y1p is black):
        if y + 2 < h:
            y += 1  # go down
        pixelsnew[x, y] = 127

    if skip > 1000:
        if pixelsnew[x, y] is 127:
            break
    skip+=1
inew.save('out.bmp')





