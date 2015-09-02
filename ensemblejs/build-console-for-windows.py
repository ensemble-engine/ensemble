import zipfile
import os
import shutil
import subprocess
import platform
print ('Hello, let me make a windows executable of the authoring tool for you today!')

#Create a zip file of an entire directory (src) and save the zip file to dst.
def zip(src, dst):
    zf = zipfile.ZipFile("%s.zip" % (dst), "w", zipfile.ZIP_DEFLATED)
    abs_src = os.path.abspath(src)
    for dirname, subdirs, files in os.walk(src):
        for filename in files:
            absname = os.path.abspath(os.path.join(dirname, filename))
            arcname = absname[len(abs_src) + 1:]
            print ('zipping %s as %s' % (os.path.join(dirname, filename),
                                        arcname))
            zf.write(absname, arcname)
    zf.close()

def zipdir(path, zipObject):
  for root, dirs, files in os.walk(path):
    for file in files:
      zipObject.write(os.path.join(root, file) , os.path.join(root, file))

def zipRelease(path, zipObject):
  for root, dirs, files in os.walk(path):
    for file in files:
      zipObject.write(os.path.join(root, file))

def putFileInZip(srcFile, zipFile, newName):
  zipFile.write(srcFile, newName)

#create a zip file containing a single file
def zipSingleFile(srcFile, dst):
    zf = zipfile.ZipFile("%s.zip" % (dst), "w", zipfile.ZIP_DEFLATED)
   # abs_src = os.path.abspath(srcFile)
   # absname = os.path.abspath(os.path.join(dirname, filename))
   # arcname = absname[len(abs_src) + 1:]
   # print ('zipping %s as %s' % (os.path.join(dirname, filename), arcname))
    zf.write(srcFile)
    zf.close()

#Put 'hard coded' files into a zip file.
def zipNodeWebkitFiles(dst):
    zf = zipfile.ZipFile("%s.zip" % (dst), "w", zipfile.ZIP_DEFLATED)
   # abs_src = os.path.abspath(srcFile)
   # absname = os.path.abspath(os.path.join(dirname, filename))
   # arcname = absname[len(abs_src) + 1:]
   # print ('zipping %s as %s' % (os.path.join(dirname, filename), arcname))
    zf.write("index.html")
    zf.write("package.json")
    zf.close()

#Just create an empty zip file!
def makeEmptyZipFile(zipName):
	zf = zipfile.ZipFile("%s.zip" % (zipName), "w", zipfile.ZIP_DEFLATED)

zipFileName = "pythonOutput"
releaseName = "authoringTool-Windows"

#Python doesn't like creating zip files with the same names as things that already exist.
#So remove them if they already exist! We'll just make new ones of them again later.
try:
    os.remove(zipFileName + ".zip")
except OSError:
    pass
try:
    os.remove(zipFileName + ".nw")
except OSError:
    pass


#This is the function that has some things hard coded...
#zipNodeWebkitFiles(zipFileName)
#print(os.name)

zipf = zipfile.ZipFile(zipFileName + '.zip', 'w')
zipdir("ensembletool", zipf)
zipdir("js", zipf)
zipdir("jslib", zipf)
zipdir("css", zipf)
zipdir("data", zipf)
putFileInZip("nwk-package.json", zipf, "package.json")
zipf.close()



#rename the folder to be .nw insted of .zip
os.rename(zipFileName + ".zip", zipFileName + ".nw")



#Change to the directory we care about.
os.chdir("nwjs-v0.12.0-win-x64")


try:
    os.remove(zipFileName + ".zip")
except OSError:
    pass
try:
    os.remove(zipFileName + ".nw")
except OSError:
    pass
try:
    os.remove(zipFileName + ".exe")
except OSError:
    pass

#move the folder to be in the node-webkit build thing directory
shutil.move("../" + zipFileName + ".nw", zipFileName +".nw")


#copy command magic!
#This command changes depending on the operating system we are running
#this script on.
currentOperatingSystem = platform.system()
if(currentOperatingSystem == "Windows"):
  os.system("copy /b nw.exe+" + zipFileName + ".nw " + zipFileName + ".exe")
else:
  os.system("cat nw.exe " + zipFileName + ".nw > " + zipFileName + ".exe")



#change back to the starting directory.
os.chdir("..")

#Make our directory for 'release' (if we don't have it already!)
if not os.path.exists(releaseName):
    os.makedirs(releaseName)

#Copy over the files that we seem to need in order to make the game work.
shutil.move("nwjs-v0.12.0-win-x64/" + zipFileName + ".exe", releaseName + "/" + releaseName + ".exe")
shutil.copyfile("nwjs-v0.12.0-win-x64/icudtl.dat", releaseName + "/icudtl.dat")
shutil.copyfile("nwjs-v0.12.0-win-x64/nw.pak", releaseName + "/nw.pak")

#zip up the release folder and make it available for the world to use.
releaseZipFile = zipfile.ZipFile(releaseName + '.zip', 'w')
zipRelease(releaseName, releaseZipFile)
releaseZipFile.close()

shutil.move(releaseName + ".zip", "build/ensemble tool/" + releaseName +".zip")

#clean up after ourselves
shutil.rmtree(releaseName)


print ("All Done")