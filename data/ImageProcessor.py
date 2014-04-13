__author__ = 'William'
from PIL import Image
from PIL import ImageFilter
import os
import re
import json
import sys

blocksize = 20

# http://www.wellfireinteractive.com/blog/python-image-enhancements/
class MyGaussianBlur(ImageFilter.Filter):
    name = "GaussianBlur"

    def __init__(self, radius=2):
        self.radius = radius

    def filter(self, image):
        return image.gaussian_blur(self.radius)


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
    return l
# /End of File sort code borrow


def loadFiles(path):
    print 'files loading'
    file = []
    for img in os.listdir(path):
        if img.endswith('.jpg') or img.endswith('.png'):
            print img
            file.append(img)
    filesorted = sort_nicely(file)
    return filesorted


def ExtractInfo(path, files):
    fileinfo = {}
    lvlcounter = 0
    for file in files:
        image = Image.open(os.path.join(path, file))
        leveldata = extractVoxelCornerData(image)
        fileinfo[os.path.splitext(file)[0]] = leveldata
        lvlcounter += 1
    return fileinfo


def extractVoxelCornerData(img):
    w, h = img.size
    pixel = img.load()
    corners = []
    counter = 0
    for y in range(0, h - blocksize, blocksize-1):
        for x in range(0, w - blocksize, blocksize-1):
            corners.append({'voxelcounter': counter, 'cornerdata': [
                {'px': pixel[x, y]},  #0
                {'px': pixel[(x + blocksize) - 1, y]},  #1
                {'px': pixel[x, (y + blocksize) - 1]},  #3
                {'px': pixel[(x + blocksize) - 1, (y + blocksize) - 1]}  #2
            ]})
            counter += 1
    return corners

def extract(path, files):
    fileinfo = ExtractInfo(path, files)
    dump = open(os.path.join(path, 'data.json'), 'w')
    json.dump(fileinfo, dump)


def resize(path, files):
    size = input("Enter the size: ")
    for file in files:
        image = Image.open(os.path.join(path, file))
        out = image.resize((int(size), int(size)))
        saveoutfile(out, path, file, 'resized')


def blur(path, files):
    radius = input("Enter the radius: ")
    for file in files:
        image = Image.open(os.path.join(path, file))
        out = image.filter(ImageFilter.GaussianBlur(radius=int(radius)))
        saveoutfile(out, path, file, 'blurred')


def convertToGrayscaleJpeg(path, files):
    for file in files:
        img = Image.open(os.path.join(path, file))
        back = Image.new("RGB", img.size, (255, 255, 255)) # background filled with white
        back.paste(img, mask=img)
        saveoutfile(back, path, "%s.jpg" % os.path.splitext(file)[0], "converted")


def saveoutfile(img, path, file, outfoldername):
        newdir = os.path.join(path, outfoldername)
        if not os.path.exists(newdir):
            os.makedirs(newdir)
        filename, ext = os.path.splitext(file)
        if ext == ".png":
            format = "PNG"
        elif ext == ".jpg":
            format = "JPEG"
        img.save(os.path.join(newdir, file), format)


def createDuplicates(path, files):
    numberOfDups = input("Enter the number of duplicates wanted: ")
    for file in files:
        ext = os.path.splitext(file)[1][1:]
        img = Image.open(os.path.join(path, file))
        for i in range(0, numberOfDups):
            saveoutfile(img, path, "%s.%s" % (i, ext), 'duplicated')


def main():
    if len(sys.argv) < 3:
        print "Expecting 2 arguments, path, operation"
        sys.exit(0)
    path = sys.argv[1]
    files = loadFiles(path)
    if sys.argv[2] == 'extract':
        extract(path, files)
    elif sys.argv[2] == 'resize':
        resize(path, files)
    elif sys.argv[2] == 'blur':
        blur(path, files)
    elif sys.argv[2] == 'duplicate':
        createDuplicates(path, files)
    elif sys.argv[2] == 'convert':
        convertToGrayscaleJpeg(path, files)


if __name__ == "__main__": main()


