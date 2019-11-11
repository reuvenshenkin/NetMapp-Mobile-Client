package com.netmapp;

import android.app.Service;
import android.location.LocationManager;
import android.location.LocationListener;
import android.location.Location;
import android.content.Intent;
import android.os.IBinder;
import android.app.Notification;
import android.annotation.TargetApi;
import androidx.annotation.Nullable;
import android.Manifest;
import androidx.core.content.ContextCompat;
import android.content.pm.PackageManager;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationCompat.Builder;
import android.os.Build;
import android.os.Bundle;
import android.app.PendingIntent;
import android.graphics.BitmapFactory;
import android.content.Context;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;

public class GeoLocationService extends Service {
    public static final String FOREGROUND = "com.netmapp.location.FOREGROUND";
    private static int GEOLOCATION_NOTIFICATION_ID = 12345689;
    public static final String CHANNEL_ID = "ForegroundServiceChannel";

    LocationManager locationManager = null;
    LocationListener locationListener = new LocationListener() {
        @Override
        public void onLocationChanged(Location location) {
            GeoLocationService.this.sendMessage(location);
        }

        @Override
        public void onStatusChanged(String s, int i, Bundle bundle) {
        }

        @Override
        public void onProviderEnabled(String s) {
        }

        @Override
        public void onProviderDisabled(String s) {
        }
    };

    @Override
    @TargetApi(Build.VERSION_CODES.M)
    public void onCreate() {
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);

        int permissionCheck = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION);
        if (permissionCheck == PackageManager.PERMISSION_GRANTED) {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 30000, 0, locationListener);
            } else if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 30000, 0, locationListener);
            } else if (locationManager.isProviderEnabled(LocationManager.PASSIVE_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.PASSIVE_PROVIDER, 30000, 0, locationListener);
            }
        }

    }

    private void sendMessage(Location location) {
        try {
            Intent intent = new Intent("GeoLocationUpdate");
            intent.putExtra("message", location);
            LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onDestroy() {
        locationManager.removeUpdates(locationListener);
        super.onDestroy();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createNotificationChannel();
        startForeground(GEOLOCATION_NOTIFICATION_ID, getCompatNotification());
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private Notification getCompatNotification() {
        Notification.Builder builder = new Notification.Builder(this, CHANNEL_ID);
        String str = "Is using your location in the background";

        builder.setSmallIcon(R.mipmap.ic_launcher).setChannelId(CHANNEL_ID)
                .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher))
                .setContentTitle("NetMapp").setContentText(str).setTicker(str).setWhen(System.currentTimeMillis());
        Intent startIntent = new Intent(getApplicationContext(), MainActivity.class);
        PendingIntent contentIntent = PendingIntent.getActivity(this, 0, startIntent, 0);
        builder.setContentIntent(contentIntent);
        return builder.build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(CHANNEL_ID, "Foreground Service Channel",
                    NotificationManager.IMPORTANCE_DEFAULT);

            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(serviceChannel);
        }
    }
}