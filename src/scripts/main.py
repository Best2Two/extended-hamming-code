import math

#Hamming
def ConvertListToHammingCodeList(blocksize,parity,data):
    ParityIndex=1
    l = [0]*blocksize
    j=1
    for i in range (1,blocksize):
        #Set parity indecies to be each bit in a bit string respectively
        if(i==ParityIndex):
         ParityIndex<<=1
         j+=1
        else:
            l[i] = data[i-j]
    return l

def SetBlockHammingParity(data,parity):
    for i in range(len(data)):
      ParityIndx=1
 
      for j in range(parity):
       
    #Updata parity of each group
       if((i&ParityIndx)):
          data[ParityIndx]^=data[i]

          data[0]^=data[i]

       ParityIndx<<=1

    #Set Parity for all of the block 
      else:
       data[0]^=data[i]

    return data

def SetHammingCode(blocksize, parity, data):
    
    data = ConvertListToHammingCodeList(blocksize,parity,data)
    data = SetBlockHammingParity(data,parity)

    return data

#Receiver
def ExtendedHammingCodeDetector(data, blocksize):

   err=0
   group_parity=0

   for i, bit in enumerate(data):
    
    if bit:
        group_parity^=bit
        err ^= i
   
   if(group_parity==0):      
   #return -1 indicating a 2 bit error detection
        if(err!=0):
         return -1      
    #returning 0 indicating no error
        return 0
  
  #if one bit error it will return the bit error in 1-based index
   return err+1

#Helper functions

def ConvertStringToWorkingList(str, datasize):
   str=str.zfill(datasize)
   return [int(ch) for ch in str]

def ConvertListToString(li):
    return ''.join(map(str, li))


def get_block_metadata(blocksize):
    parity = int(math.log2(blocksize))
    datasize = blocksize-parity-1
    return parity,datasize


#-----------------------------Functions being called from JS----------------------------------
def set_hamming_code(data,blocksize):
    meta_data = get_block_metadata(blocksize)

    data = ConvertStringToWorkingList(data,meta_data[1])
    return ConvertListToString(SetHammingCode(blocksize, meta_data[0], data))

def check_hamming_code(data,blocksize):
    meta_data = get_block_metadata(blocksize)

    data = ConvertStringToWorkingList(data,meta_data[1])
    return ExtendedHammingCodeDetector(data,blocksize)


def replace_char(s, index, new_char):
    if index < 0 or index >= len(s):
        raise ValueError("Index out of range")
    return s[:index] + new_char + s[index+1:]
