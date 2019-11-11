/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */



import ToastExample from './ToastExample';
import AndroidSignalStrengthExample from './AndroidSignalStrengthExample';
import GeoLocation from './GeoLocationServiceExample';
import { AppRegistry, DeviceEventEmitter, NativeEventEmitter, NativeModules, StyleSheet, PermissionsAndroid, Platform, Text, View, Button, ToastAndroid } from 'react-native';
import React, { Component } from 'react';
import Geolocation from 'react-native-geolocation-service';
import NetInfo from "@react-native-community/netinfo";
import DeviceInfo from 'react-native-device-info';

export default class NetMApp extends Component {
  watchId = null;
  connectionType = null;

  state = {
    type: null,
    MNO: null,
    time: null,
    signal_strength: null,
    latitude: null,
    longitude: null,
    generation: null,
    updatesEnabled: false
  }

  async hasLocationPermission() {
    if (Platform.OS === 'ios' ||
      (Platform.OS === 'android' && Platform.Version < 23)) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (hasPermission) return true;

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (status === PermissionsAndroid.RESULTS.GRANTED) return true;

    if (status === PermissionsAndroid.RESULTS.DENIED) {
      ToastAndroid.show('Location permission denied by user.', ToastAndroid.LONG);
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      ToastAndroid.show('Location permission revoked by user.', ToastAndroid.LONG);
    }

    return false;
  }

  async getLocationUpdates() {
    const hasLocationPermission = await this.hasLocationPermission();
    if (!hasLocationPermission) return;
    this.watchId = Geolocation.watchPosition(
      async (position) => {
        var state = await NetInfo.fetch();
        this.connectionType = state.type;
        if (state.type === "cellular") {
          var cellularGeneration = state.details.cellularGeneration;
          var MNO = state.details.carrier + "";
        }
        this.setState({
          type: await DeviceInfo.getManufacturer() + " " + DeviceInfo.getModel(),
          MNO: MNO,
          time: new Date() + "",
          signal_strength: await AndroidSignalStrengthExample.getSignalStrength() + "",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          generation: cellularGeneration,
          updatesEnabled: true
        });
        console.log(this.state);
        await this.postInfoToDB(this.state);
      },
      (error) => {
        this.setState({ location: error });
        console.log(error);
      },
      { enableHighAccuracy: true, distanceFilter: 20, interval: 5000, fastestInterval: 2000 }
    );
  }

  removeLocationUpdates() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.setState({ updatesEnabled: false })
    }
  }

  async requestPermissions() {
    let details = {}, dbEntry = {};
    dbEntry.time = new Date() + "";
    details.date = dbEntry.time;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'NetMapp Permissions',
          message:
            'NetMapp needs access to your coarse location' +
            'so you can could share your signal strength info',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the location info');
        // while (true){
        let num = await AndroidSignalStrengthExample.getSignalStrength()
        dbEntry.signal_strength = num + "";
        details.signalStrength = dbEntry.signal_strength;
        console.log('signalStrength ' + dbEntry.signal_strength);



        NetInfo.fetch().then(state => {
          console.log("Connection type", state.type);
          details.connectionType = state.type ? state.type : "not available";
          if (state.type === "cellular") {
            details.cellularGeneration = state.details.cellularGeneration;
            dbEntry.MNO = state.details.carrier + "";
            details.carrier = dbEntry.MNO;
          }
          console.log("Is connected?", state.isConnected);
        });
        let manufacturer = await DeviceInfo.getManufacturer(), model = DeviceInfo.getModel();
        dbEntry.type = manufacturer + " " + model;
        console.log('getManufacturer:  ' + manufacturer);
        details.manufacturer = manufacturer ? manufacturer : "not available";
        console.log('getModel:  ' + model);
        details.model = model ? model : "not available";
        this.details = details;
        await Geolocation.getCurrentPosition(
          (position) => {
            console.log(position);
            dbEntry.latitude = position.coords.latitude + "";
            dbEntry.longitude = position.coords.longitude + "";
            details.latitude = dbEntry.latitude;
            details.longitude = dbEntry.longitude;
            console.log("latitude" + position.coords.latitude);
            this.details = details;
            if (details.connectionType === "cellular") {

              (async () => {
                console.log(dbEntry);
                let res = await fetch('http://ec2-18-219-102-0.us-east-2.compute.amazonaws.com:3000/signalgps', {
                  method: 'POST',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(
                    dbEntry
                  ),
                });
                // resJson = await res.json();
                console.log(res);

              })();
            }
          },
          (error) => {
            // See error code charts below.
            console.log(error.code, error.message);
            details.latitude = "Not Available";
            details.longitude = "Not Available";
          },
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 }
        );
        this.details = details;
        // }
      } else {
        console.log('Location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  }

  async postInfoToDB(info) {
    if (this.connectionType === "cellular") {
      try {
        await fetch('http://ec2-18-219-102-0.us-east-2.compute.amazonaws.com:3000/signalgps', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            info
          ),
        });
        console.log("info posted to DB");
      } catch (error) {
        console.log(error);
      }
    } else {
      ToastAndroid.show('Please turn off wifi', ToastAndroid.SHORT);
    }
  }

  async componentDidMount() {
    DeviceEventEmitter.addListener("updateLocation", (geoData) => {
      console.log(geoData)
    });
    await this.getLocationUpdates();
    const hasLocationPermission = await this.hasLocationPermission();
    if (hasLocationPermission) {
      console.log(await GeoLocation.startService());
    }
  }

  async componentWillUnmount() {
    this.removeLocationUpdates();
    console.log(await GeoLocation.stopService());
  }

  render() {

    const { type, MNO, time, signal_strength, latitude, longitude, generation, updatesEnabled } = this.state;
    return this.state.signal_strength ? (
      <View style={{ flex: 1, justifyContent: "space-around", alignItems: "center" }}>
        <View style={styles.buttons}>
          <Button
            onPress={async () => {
              await this.getLocationUpdates();
              console.log(await GeoLocation.startService());
            }}
            title="share info"
            disabled={updatesEnabled}
          ></Button>

          <Button
            onPress={async () => {
              this.removeLocationUpdates();
              console.log(await GeoLocation.stopService());
            }}
            title="stop sharing info"
            disabled={!updatesEnabled}
          ></Button>

        </View>
        <Text>{"Time: " + time}</Text>
        <Text>{"Device Type: " + type}</Text>
        {/* <Text>{"Connection Type: " + this.connectionType}</Text> */}
        <Text>{"MNO: " + MNO}</Text>
        <Text>{"Cellular Generation: " + generation}</Text>
        <Text>{"Signal Strength: " + signal_strength}</Text>
        <Text>{"Latitude: " + latitude}</Text>
        <Text>{"Longitude: " + longitude}</Text>
      </View>
    )
      : (
        <View style={{ flex: 1, justifyContent: "space-around", alignItems: "center" }}>
          <Button
            onPress={async () => {
              this.removeLocationUpdates();
              await this.getLocationUpdates();
            }}
            title="share info"
            disabled={updatesEnabled}
          ></Button>
        </View>);
  }
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 12,
    width: '100%'
  }
});