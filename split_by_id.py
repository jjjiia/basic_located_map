import csv
import json

def splitAndSaveAsJson(inputFileName,key):
    csvReader = csv.reader(open(inputFileName, "rb"))
    for row in csvReader:
        header = row
        print len(header)
        break
    mainKeyIndex = header.index(key)
    
    for row in csvReader:
        outFileName = row[mainKeyIndex]
        
        geoidDict = {}
        for i in range(0,len(row)):
            geoidDict[header[i]]=row[i].decode('latin-1', 'replace')
        json.dump(geoidDict,open("census_by_geo/"+outFileName+".json","w"))


splitAndSaveAsJson("R11910199_SL140.csv","Geo_GEOID")

#test = "Census Tract 1.02, Do\xf1a Ana County, New Mexico"
#print test.decode('latin-1', 'replace')
#print test.encode("utf-8")
#print u"Census Tract 1.02, Do\xf1a Ana County, New Mexico"