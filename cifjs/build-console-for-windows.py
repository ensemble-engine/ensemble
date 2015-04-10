import zipfile
import os
import shutil
import subprocess
print ('Hello')

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

zipFileName = "pythonOutput2"

#Python doesn't like creating zip files with the same names as things that already exist.
#So remove them if they already exist! We'll just make new ones of them again later.
try:
    os.remove(zipFileName + ".zip")
    os.remove(zipFileName + ".nw")
except OSError:
    pass

#This is the function that has some things hard coded...
zipNodeWebkitFiles(zipFileName)

#rename the folder to be .nw insted of .zip
os.rename(zipFileName + ".zip", zipFileName + ".nw")

#move the folder to be in the node-webkit build thing directory
shutil.move(zipFileName + ".nw", "nwjs-v0.12.0-win-x64/nwjs-v0.12.0-win-x64/" + zipFileName +".nw")

#Change to the directory we care about.
os.chdir("nwjs-v0.12.0-win-x64/nwjs-v0.12.0-win-x64")

#copy command magic!
os.system("copy /b nw.exe+pythonOutput2.nw superDuperApp.exe")

#change back to the starting directory.
os.chdir("..")
os.chdir("..")

#Make our directory for 'release' (if we don't have it already!)
if not os.path.exists("release"):
    os.makedirs("release")

#Copy over the files that we seem to need in order to make the game work.
shutil.move("nwjs-v0.12.0-win-x64/nwjs-v0.12.0-win-x64/superDuperApp.exe", "release/evenSupererApp.exe")
shutil.copyfile("nwjs-v0.12.0-win-x64/nwjs-v0.12.0-win-x64/icudtl.dat", "release/icudtl.dat")
shutil.copyfile("nwjs-v0.12.0-win-x64/nwjs-v0.12.0-win-x64/nw.pak", "release/nw.pak")

print ("All Done")