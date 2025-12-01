
import {
    AppConfig,
    showConnect,
    type UserData,
    UserSession
} from "@stacks/connect"
import { useEffect, useState } from "react";




const appConfig = new AppConfig(["store_write", "publish_data"])
const userSession = new UserSession({ appConfig })


export function useAuth() {
    const [userData, setUserData] = useState<UserData | null>(null);

    const appDetails = {
        name: "StackNStay",
        icon: "/favicon.png"
    };


    const connectWallet = () => {
        showConnect({
            appDetails,
            onFinish: () => {
                // Redirect to properties page after successful connection
                window.location.href = '/properties';
            },
            userSession
        })
    }

    const disconnectWallet = () => {
        userSession.signUserOut();
        setUserData(null);
    }


    useEffect(() => {
        if (userSession.isSignInPending()) {
            userSession.handlePendingSignIn().then((userData) => {
                setUserData(userData);
                // Redirect to properties after sign-in completes
                window.location.href = '/properties';
            });
        } else if (userSession.isUserSignedIn()) {
            setUserData(userSession.loadUserData());
        }
    }, []);


    return {
        userData,
        appDetails,
        connectWallet,
        disconnectWallet
    }
}