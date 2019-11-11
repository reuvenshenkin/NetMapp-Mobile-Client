package main.java.com.netmapp;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import android.telephony.TelephonyManager;
import android.telephony.CellInfoCdma;
import android.telephony.CellSignalStrengthCdma;
import android.telephony.CellInfoGsm;
import android.telephony.CellSignalStrengthGsm;
import android.telephony.CellInfoLte;
import android.telephony.CellSignalStrengthLte;
// import android.telephony.CellInfoNr;
// import android.telephony.CellSignalStrengthNr;
// import android.telephony.CellInfoTdscdma;
// import android.telephony.CellSignalStrengthTdscdma;
import android.telephony.CellInfoWcdma;
import android.telephony.CellSignalStrengthWcdma;
import android.content.Context;
import android.net.wifi.WifiManager;
import com.facebook.react.bridge.Promise;

public class AndroidSignalStrengthModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;

    AndroidSignalStrengthModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "AndroidSignalStrengthExample";
    }

    @ReactMethod
    public void getSignalStrength(Promise p) {

        TelephonyManager telephonyManager = (TelephonyManager) getReactApplicationContext()
                .getSystemService(Context.TELEPHONY_SERVICE);
        try {
            CellInfoWcdma cellInfoWcdma = (CellInfoWcdma) telephonyManager.getAllCellInfo().get(0);
            CellSignalStrengthWcdma cellSignalStrengthWcdma = cellInfoWcdma.getCellSignalStrength();
            p.resolve(cellSignalStrengthWcdma.getDbm());
        } catch (Exception e1) {
            // try{
            // CellInfoTdscdma cellInfoTdscdma =
            // (CellInfoTdscdma)telephonyManager.getAllCellInfo().get(0);
            // CellSignalStrengthTdscdma cellSignalStrengthTdscdma =
            // cellInfoTdscdma.getCellSignalStrength();
            // p.resolve(cellSignalStrengthTdscdma.getDbm());
            // }catch(Exception e2){
            // try{
            // CellInfoNr cellInfoNr = (CellInfoNr)telephonyManager.getAllCellInfo().get(0);
            // CellSignalStrengthNr cellSignalStrengthNr =
            // cellInfoNr.getCellSignalStrength();
            // p.resolve(cellSignalStrengthNr.getDbm());
            // }catch(Exception e3){
            try {
                CellInfoLte cellInfoLte = (CellInfoLte) telephonyManager.getAllCellInfo().get(0);
                CellSignalStrengthLte cellSignalStrengthLte = cellInfoLte.getCellSignalStrength();
                p.resolve(cellSignalStrengthLte.getDbm());
            } catch (Exception e4) {
                try {
                    CellInfoGsm cellInfoGsm = (CellInfoGsm) telephonyManager.getAllCellInfo().get(0);
                    CellSignalStrengthGsm cellSignalStrengthGsm = cellInfoGsm.getCellSignalStrength();
                    p.resolve(cellSignalStrengthGsm.getDbm());
                } catch (Exception e5) {
                    try {
                        CellInfoCdma cellInfoCdma = (CellInfoCdma) telephonyManager.getAllCellInfo().get(0);
                        CellSignalStrengthCdma cellSignalStrengthCdma = cellInfoCdma.getCellSignalStrength();
                        p.resolve(cellSignalStrengthCdma.getDbm());
                    } catch (Exception e6) {
                        p.resolve("Signal strength not available");
                    }
                }
            }
        }

    }
}