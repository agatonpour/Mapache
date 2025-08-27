# Mapache

**Mapache** is a web application that visualizes environmental sensor data collected by **RaccoonBot**, an autonomous monitoring robot developed at the UC Irvine Robot Ecology Lab.

## Overview

Mapache serves as the frontend interface in an Edge-to-Cloud (IoT) architecture. It is designed to provide researchers and field operators with live insights into environmental conditions during outdoor robot deployments, as well as export and data download capabilities

## System Architecture

1. **Sensor Collection (Edge Layer)**  
   The RaccoonBot carries sensors (temperature, humidity, pressure, Co2, TVOC and AQI) and uses an onboard microcontroller to collect readings in the field.

2. **Wireless Transmission**  
   The microcontroller transmits data via a LoRa module to a nearby base station server on a Raspberry Pi.

3. **Edge Gateway Processing**  
   The Raspberry Pi server acts as a relay, receiving LoRa signals and forwarding the structured sensor data to the cloud database.

4. **Cloud Database Storage**  
   The data is securely stored in a Firebase Firestore database, enabling real-time access and historical tracking.

5. **Frontend Interface (Mapache)**  
   Mapache connects directly to Firestore to display historic and real-time sensor readings. It presents the data in a clean, responsive interface suitable for both desktop and mobile use.

## Features

- Real-time data syncing from Firestore
- Organized display of sensor values with timestamps
- Responsive UI built with accessibility in mind
- Easy to deploy and maintain

## Tech Stack

- React + TypeScript
- Firebase Firestore (NoSQL, real-time database)
- Static hosting (Firebase Hosting)
- LoRa + Raspberry Pi used for backend transmission (in separate repo)

## Repository Scope

This repository contains only the **frontend client** of the Mapache project. The backend logic (Raspberry Pi and microcontroller firmware) is managed separately.

## Future Work

- Integration of machine learning models for data trend detection, and insights
- Enhanced charting and graphing functionality

## Author

Agaton Pourshahidi  
Robot Ecology Lab, UC Irvine  
[ajpoursh@uci.edu](mailto:ajpoursh@uci.edu)
