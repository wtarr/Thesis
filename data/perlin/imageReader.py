__author__ = 'William'
from PIL import Image
from os import listdir
from os.path import isfile, join
import re

blocksize = 40

# File sort http://nedbatchelder.com/blog/200712.html#e20071211T054956
def tryint(s):
    try:
        return int(s)
    except:
        return s

def alphanum_key(s):
    """ Turn a string into a list of string and number chunks.
        "z23a" -> ["z", 23, "a"]
    """
    return [ tryint(c) for c in re.split('([0-9]+)', s) ]

def sort_nicely(l):
    """ Sort the given list in the way that humans expect.
    """
    l.sort(key=alphanum_key)
# /File sort

def loadImages(path):
    print 'files loading'
    files = [f for f in listdir(path) if isfile(f) and f.endswith('.jpg')]
    sort_nicely(files)
    return files

def ExtractInfo(files):
    for file in files:
        image = Image.open(file)
        leveldata = extractVoxelCornerData(image)
        #print file

def extractVoxelCornerData(img):
    w, h = img.size
    pixel = img.load()
    for y in range(0, h - blocksize, blocksize):
        for x in range(0, w - blocksize, blocksize):
            c0 = [x, y]
            c1 = [x, y]
            c3 = [x, y]
            c2 = [x, y]



def main():
    files = loadImages('.')
    loadImages(files)
    out = {'a': files}


if __name__ == "__main__":main()


