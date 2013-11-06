__author__ = 'William'
import Image

white = 255
black = 0
timeout = 10000

def loadImage():
    im = Image.open("large.bmp")
    w, h = im.size
    return im, w, h


def createBlankImage(w, h):
    imgNew = Image.new("P", (w, h))
    pix = imgNew.load()
    for x in range(w):
        for y in range(h):
            pix[x, y] = white
    return imgNew


def marchingSquare(im, w, h, imgNew):
    pixels = im.load()
    pixelsnew = imgNew.load()
    x = 0
    y = 250

    skip = 0

    while True:
        x0p = pixels[x, y]
        y0p = pixels[x + 1, y]
        x1p = pixels[x, y + 1]
        y1p = pixels[x + 1, y + 1]

        if isALeftState(x0p, y0p, x1p, y1p):
            if x+2 < w:
                x += 1  # go right
            pixelsnew[x, y] = black
        elif isARightState(x0p, y0p, x1p, y1p):
            if x-1 >= 0:
                x -= 1  # go left
            pixelsnew[x, y] = black
        elif isAUpState(x0p, y0p, x1p, y1p):
            if y - 1 >= 0:
                y -= 1  # go up
            pixelsnew[x, y] = black
        elif isADownState(x0p, y1p, x1p, y1p):
            if y + 2 < h:
                y += 1  # go down
            pixelsnew[x, y] = black

        if skip > timeout:
            break
        skip+=1
    imgNew.save('out.bmp')


def isALeftState(x0p, y0p, x1p, y1p):
            if (x0p is white and y0p is white and x1p is white and y1p is white) or \
            (x0p is black and y0p is black and x1p is white and y1p is white) or \
            (x0p is black and y0p is black and x1p is black and y1p is white) or \
            (x0p is white and y0p is black and x1p is white and y1p is white):
                return True
            else:
                return False

def isARightState(x0p, y0p, x1p, y1p):
    if (x0p is white and y0p is white and x1p is black and y1p is black) or \
       (x0p is white and y0p is black and x1p is black and y1p is black) or \
       (x0p is white and y0p is black and x1p is black and y1p is white) or \
       (x0p is white and y0p is white and x1p is black and y1p is white):
            return True
    else:
            return False

def isAUpState(x0p, y0p, x1p, y1p):
    if (x0p is black and y0p is white and x1p is white and y1p is white) or \
        (x0p is black and y0p is white and x1p is black and y1p is black) or \
        (x0p is black and y0p is white and x1p is black and y1p is white) or \
        (x0p is black and y0p is white and x1p is white and y1p is black):
            return True
    else:
            return False

def isADownState(x0p, y0p, x1p, y1p):
    if (x0p is white and y0p is black and x1p is white and y1p is black) or \
        (x0p is white and y0p is white and x1p is white and y1p is black) or \
        (x0p is black and y0p is black and x1p is white and y1p is black):
            return True
    else:
            return False

def main():
    im, w, h = loadImage()
    imgNew = createBlankImage(w, h)
    marchingSquare(im, w, h, imgNew)


if __name__ == "__main__":main()

