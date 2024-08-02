'use client';

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Button, Box, TextField, Stack, Modal } from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import { firestore } from "./firebase";
import { collection, doc, query, getDocs, deleteDoc, setDoc, getDoc } from "firebase/firestore";
import { storage } from "./firebase";
import { Camera } from "react-camera-pro";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [cameraVisible, setCameraVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const camera = useRef(null);

  const capturePhoto = async () => {
    try {
      if (camera.current) {
        // Check if the device has a camera
        const hasCamera = camera.current.getNumberOfCameras() > 0;
        if (!hasCamera) {
          alert("No camera device accessible. Please connect your camera or try a different browser.");
          return;
        }

        const imageSrc = camera.current.takePhoto();
        await uploadImage(imageSrc);
        setCameraVisible(false);
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
      alert("Failed to capture photo. Please ensure your camera is accessible and try again.");
    }
  };

  const uploadImage = async (imageSrc) => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();

      const name = `${selectedItem}-${Date.now()}.jpg`;
      const storageRef = ref(storage, `images/${name}`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      const itemDocRef = doc(firestore, 'inventory', selectedItem);
      await setDoc(itemDocRef, { imageUrl: url }, { merge: true });

      console.log(`Uploaded image for ${selectedItem} available at: ${url}`);
      setImageUrl(url);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };
  



  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'white',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  };

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const addItem = async (item) => {
    if (!item) return;
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity > 1) {
        await setDoc(docRef, { quantity: quantity - 1 });
      } else {
        await deleteDoc(docRef);
      }
    }
    await updateInventory();
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
    >
      <Box 
        width="800px" 
        position="sticky" 
        top={0} 
        bgcolor="white" 
        zIndex={1} 
        mb={2} 
        p={2} 
        display="flex"
        justifyContent="flex-start"
        gap={2} 
      >
        <TextField
          id="search-bar"
          label="Search Inventory"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            mt: 2,
            mb: 2,
            pl: 1,
            pt: 1,
            pb: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px', 
            },
            '& .MuiInputBase-root': {
              height: '40px', 
            },
            '& .MuiInputBase-input': {
              padding: '8px 12px', 
            },
          }}
          InputProps={{
            style: {
              height: 'inherit', 
            }
          }}
        />
        <Button 
          variant="outlined" 
          onClick={handleOpen} 
          sx={{
            height:'36px',
            padding: '6px 16px', 
            fontSize: '8px',
            '&:hover': {
              borderColor: '#0056b3',
            } ,
          }}
        >
          Add New Item
        </Button>
      </Box>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width="100%" direction={'row'} spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                addItem(itemName);
                setItemName('');
                handleClose();
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      
      <TableContainer component={Paper} width="800px" overflow="auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Actions</TableCell>
              <TableCell>Image</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInventory.map(({ name, quantity, imageUrl }) => (
              <TableRow key={name}>
                <TableCell>{name.charAt(0).toUpperCase() + name.slice(1)}</TableCell>
                <TableCell>{quantity}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    onClick={() => addItem(name)}
                    sx={{
                      height: '36px',
                      padding: '6px 16px',
                      fontSize: '14px',
                      marginRight: '8px',
                      borderColor: 'green', 
                      color: 'green', 
                      '&:hover': {
                        borderColor: 'darkgreen', 
                        color: 'darkgreen', 
                      },
                    }}
                  >
                    Add
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => removeItem(name)}
                    sx={{
                      height: '36px',
                      padding: '6px 16px',
                      fontSize: '14px',
                      borderColor: 'red', 
                      color: 'red', 
                      '&:hover': {
                        borderColor: 'darkred', 
                        color: 'darkred', 
                      },
                    }}
                  >
                    Remove
                  </Button>
                </TableCell>
                <TableCell>
                  {imageUrl ? (
                    <img src={imageUrl} alt={`${name} image`} style={{ width: '100px', height: 'auto' }} />
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSelectedItem(name);
                        setCameraVisible(true);
                      }}
                      sx={{
                        height: '36px',
                        padding: '6px 16px',
                        fontSize: '14px',
                        marginRight: '8px',
                      }}
                    >
                      Capture Photo
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {cameraVisible && (
        <Modal
          open={cameraVisible}
          onClose={() => setCameraVisible(false)}
          aria-labelledby="camera-modal-title"
          aria-describedby="camera-modal-description"
        >
          <Box sx={{ ...style, width: 'auto' }}>
            <Camera ref={camera} />
            <Button onClick={capturePhoto} variant="contained" color="primary">
              Take Photo
            </Button>
          </Box>
        </Modal>
      )}
    </Box>
  );
}
