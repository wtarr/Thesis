__author__ = 'William'
from PIL import Image
import os
import re
import json

blocksize = 80

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
    return [tryint(c) for c in re.split('([0-9]+)', s)]


def sort_nicely(l):
    """ Sort the given list in the way that humans expect.
    """
    l.sort(key=alphanum_key)


# /File sort

def loadFiles(path):
    print 'files loading'
    file = [f for f in os.listdir('.') if os.path.isfile(f) and f.endswith('.jpg')]
    sort_nicely(file)
    return file


def ExtractInfo(files):
    fileinfo = {}
    lvlcounter = 0
    for file in files:
        image = Image.open(file)
        leveldata = extractVoxelCornerData(image)
        fileinfo[os.path.splitext(file)[0]] = leveldata
        lvlcounter += 1
    return fileinfo


def extractVoxelCornerData(img):
    w, h = img.size
    pixel = img.load()
    corners = []
    counter = 0
    for y in range(0, h - blocksize, blocksize - 1):
        for x in range(0, w - blocksize, blocksize - 1):
            #print x
            corners.append({'voxelcounter': counter, 'cornerdata': [
                {'px': pixel[x, y]},  #0
                {'px': pixel[x + blocksize, y]},  #1
                {'px': pixel[x, y + blocksize]},  #3
                {'px': pixel[x + blocksize, y + blocksize]}  #2
            ]})
            counter += 1
    print counter
    return corners


def main():
    files = loadFiles(os.path.dirname(os.path.realpath(__file__)))
    for f in files:
        print f
    #print files
    fileinfo = ExtractInfo(files)
    dump = open('data.json', 'w')
    json.dump(fileinfo, dump)
    #out = {'a': files}
    print os.path.dirname(os.path.realpath(__file__))


if __name__ == "__main__": main()


