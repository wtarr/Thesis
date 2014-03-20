__author__ = 'William'
from PIL import Image
from os import listdir
from os.path import isfile, join
import re

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

def loadImages(files):


    for file in files:
        im = Image.open(file)




def main():
    files = loadImages('.')
    loadImages(files)
    out = {'a': files}


if __name__ == "__main__":main()


