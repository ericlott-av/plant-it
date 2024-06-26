import { useEffect, useState } from "react";
import { AxiosError, AxiosInstance } from 'axios';
import { NavigateFunction, useNavigate } from "react-router";
import secureLocalStorage from "react-secure-storage";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import FormControl from '@mui/material/FormControl';
import { FormHelperText } from "@mui/material";
import ErrorDialog from "./ErrorDialog";
import { getErrMessage, isBackendReachable } from "../common";

export default function Auth(props: { requestor: AxiosInstance; }) {
    const navigate: NavigateFunction = useNavigate();
    const [authMode, setAuthMode] = useState<"register" | "login" | "forgot" | "otp" | undefined>();
    const [credentials, setCredentials] = useState<{ username?: string, email?: string, password?: string; }>();
    const [errors, setErrors] = useState<{ username?: string, email?: string, password?: string; }>();
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [errorDialog, setErrorDialog] = useState<{ text: string, shown: boolean, title?: string; }>();
    const [otpCode, setOtpCode] = useState<string>();

    const doLogin = (event: React.SyntheticEvent) => {
        event.preventDefault();
        props.requestor.defaults.headers.common['Key'] = undefined;
        props.requestor.post("authentication/login", credentials)
            .then(res => {
                let jwt = res.data["jwt"]["value"];
                getOrCreateApiKey(jwt);
                secureLocalStorage.setItem("plant-it-username", credentials?.username || "");
            })
            .catch(err => {
                setErrorDialog({ text: getErrMessage(err), shown: true });
            });
    };

    const getOrCreateApiKey = (jwt: string) => {
        const apiKeyName: string = "frontend-app_" + credentials?.username;
        props.requestor.get("api-key/name/" + apiKeyName, {
            headers: {
                "Authorization": 'Bearer ' + jwt
            }
        })
            .then(res => {
                secureLocalStorage.setItem("plant-it-key", res.data.value);
                navigate('/');
            })
            .catch(_err => {
                props.requestor.post("api-key/?name=" + apiKeyName, {}, {
                    headers: {
                        "Authorization": 'Bearer ' + jwt
                    }
                })
                    .then(res => {
                        secureLocalStorage.setItem("plant-it-key", res.data);
                        navigate('/');
                    })
                    .catch(err => {
                        setErrorDialog({ text: getErrMessage(err), shown: true });
                    });
            });
    };

    const signUp = (event: React.SyntheticEvent) => {
        event.preventDefault();
        props.requestor.post("authentication/signup", credentials)
            .then(res => {
                if (res.status === 200) {
                    doLogin(event)
                } else if (res.status === 202) {
                    setAuthMode("otp");
                }
            })
            .catch(err => {
                setErrorDialog({ text: getErrMessage(err), shown: true });
            });
    };


    const signUpWithOTP = (event: React.SyntheticEvent) => {
        event.preventDefault();
        props.requestor.post(`authentication/signup/otp/${otpCode}`, credentials)
            .then(_res => doLogin(event))
            .catch(err => {
                setErrorDialog({ text: getErrMessage(err), shown: true });
            });
    };


    const resetPassword = (event: React.SyntheticEvent): void => {
        event.preventDefault();
        props.requestor.post(`authentication/password/reset/${credentials?.username}`)
            .then(res => {
                setErrorDialog({
                    title: "Success",
                    text: res.data,
                    shown: true
                });
            })
            .catch((err: AxiosError) => {
                setErrorDialog({
                    text: getErrMessage(err),
                    shown: true
                });
            })
    };


    const changeAuthMode = () => {
        let newAuthMode: "register" | "login" = authMode === "login" ? "register" : "login";
        setAuthMode(newAuthMode);
        // below just to recheck possible errors and enable/disable submit button
        if (newAuthMode === "login") {
            setErrors(undefined);
        } else {
            if (credentials?.username !== undefined) {
                changeUsername(credentials?.username, true);
            }
            if (credentials?.password !== undefined) {
                changePassword(credentials.password, true);
            }
        }
    };


    const changeUsername = (value: string, validate?: boolean): void => {
        if (authMode == "register" && (value.length > 20 || value.length < 3) || validate) {
            setErrors({ ...errors, username: "username length must be between 3 and 20" });
        } else {
            setErrors({ ...errors, username: undefined });
        }
        setCredentials({ username: value, password: credentials?.password, email: credentials?.email });
    };


    const changeEmail = (value: string, validate?: boolean): void => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidEmail = emailRegex.test(value);
        if (authMode == "register" && !isValidEmail || validate) {
            setErrors({ ...errors, email: "invalid email format" });
        } else {
            setErrors({ ...errors, email: undefined });
        }
        setCredentials({ email: value, password: credentials?.password, username: credentials?.username });
    };


    const changePassword = (value: string, validate?: boolean): void => {
        if (authMode == "register" && (value.length > 20 || value.length < 8) || validate) {
            setErrors({ ...errors, password: "password length must be between 8 and 20" });
        } else {
            setErrors({ ...errors, password: undefined });
        }
        setCredentials({ password: value, username: credentials?.username, email: credentials?.email });
    };


    const isSubmitButtonEnabled = (): boolean => {
        return credentials !== undefined && credentials.username !== undefined && credentials.password !== undefined &&
            credentials.username.length > 0 && credentials.password.length > 0 || (credentials !== undefined &&
                credentials.username != undefined && credentials?.username.length > 0 && authMode === "forgot");
    };


    useEffect(() => {
        isBackendReachable(props.requestor)
            .then(res => {
                if (!res) {
                    setErrorDialog({
                        text: `Cannot connect to the backend at ${props.requestor.defaults.baseURL}`,
                        shown: true
                    });
                }
            });
    }, []);

    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="space-evenly"
            alignItems="center"
            minHeight="100vh"
        >

            <ErrorDialog
                text={errorDialog?.text}
                title={errorDialog?.title}
                open={errorDialog?.shown || false}
                close={() => setErrorDialog({ text: "", shown: false })}
            />

            <Box
                sx={{
                    content: `""`,
                    background: `url(${process.env.PUBLIC_URL}/login-background.jpg)`,
                    backgroundSize: "cover",
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    opacity: 0.7,
                    backgroundColor: "rgb(0 0 0 / 60%)",
                    backgroundBlendMode: "multiply",
                    zIndex: -1,
                }} />

            {
                authMode === undefined &&
                <>
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "column",
                    }}>
                        <Typography
                            variant="h2"
                            sx={{
                                color: "black",
                                fontWeight: 800,
                            }}
                        >
                            Plant-it
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                color: "white",
                            }}
                        >
                            Your gardening companion app 🪴
                        </Typography>
                    </Box>


                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                        zIndex: 2,
                    }}>
                        <Button
                            sx={{
                                backgroundColor: "white",
                                color: "black",
                                padding: "15px 50px",
                                "&:hover": { backgroundColor: "white" },
                            }}
                            onClick={() => setAuthMode("login")}
                        >
                            Login
                        </Button>

                        <Button
                            sx={{
                                backgroundColor: "primary.main",
                                color: "white",
                                padding: "15px 50px",
                                "&:hover": { backgroundColor: "primary.main" },
                            }}
                            onClick={() => setAuthMode("register")}
                        >
                            Create an Account
                        </Button>
                    </Box>
                </>
            }
            {
                authMode != undefined &&
                <Box
                    component="form"
                    onSubmit={
                        authMode === "login" ?
                            doLogin
                            :
                            (authMode === "forgot" ?
                                resetPassword
                                :
                                (authMode === "register" ?
                                    signUp
                                    :
                                    signUpWithOTP)
                            )
                    }
                    noValidate
                    sx={{
                        mt: 1,
                        backgroundColor: "white",
                        width: "90%",
                        borderRadius: "20px",
                        padding: "20px",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            flexDirection: "column",
                            marginBottom: "20px",
                        }}>
                        <Typography
                            variant={authMode === "forgot" ? "h6" : "h4"}
                            fontWeight={600}
                        >
                            {
                                authMode === "login" ?
                                    "Login to"
                                    :
                                    (authMode === "register" ?
                                        "Register to"
                                        :
                                        (authMode === "forgot" ?
                                            "Reset password for"
                                            :
                                            "Verify email for")
                                    )}
                        </Typography>
                        <Typography
                            variant={authMode === "forgot" ? "h6" : "h4"}
                            fontWeight={600}
                            sx={{
                                color: "primary.main"
                            }}>
                            Plant-it
                        </Typography>
                    </Box>
                    {
                        authMode != "otp" &&
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            onChange={e => changeUsername(e.target.value)}
                            error={errors?.username !== undefined}
                            helperText={errors?.username}
                        />
                    }
                    {
                        authMode === "register" &&
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="enail"
                            label="Email"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            onChange={e => changeEmail(e.target.value)}
                            error={errors?.email !== undefined}
                            helperText={errors?.email}
                        />
                    }
                    <>
                        {
                            authMode !== "forgot" && authMode !== "otp" &&
                            <>
                                <FormControl fullWidth margin="normal" variant="outlined" required>
                                    <InputLabel htmlFor="password-input">Password</InputLabel>
                                    <OutlinedInput
                                        id="password-input"
                                        type={showPassword ? 'text' : 'password'}
                                        onChange={e => changePassword(e.target.value)}
                                        endAdornment={
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        }
                                        label="Password"
                                        error={errors?.password != undefined}
                                    />
                                </FormControl>
                                {
                                    authMode === "login" &&
                                    <Box sx={{
                                        textAlign: "right",
                                    }}>
                                        <Link onClick={() => setAuthMode("forgot")}>Forgot password?</Link>
                                    </Box>
                                }
                            </>
                        }
                        {
                            authMode === "otp" &&
                            <Box sx={{ padding: 1 }}>
                                <Typography>{`Please insert the code sent at ${credentials?.email}`}</Typography>
                                <FormControl fullWidth margin="normal" variant="outlined" required>
                                    <InputLabel htmlFor="otp-input">OTP Code</InputLabel>
                                    <OutlinedInput
                                        id="otp-input"
                                        type='text'
                                        onChange={e => setOtpCode(e.target.value)}
                                        label="OTP Code"
                                    />
                                </FormControl>
                            </Box>
                        }
                        {
                            errors?.password != undefined &&
                            <FormHelperText error>
                                {errors.password}
                            </FormHelperText>
                        }
                    </>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={!isSubmitButtonEnabled()}
                    >
                        {
                            authMode == "login" ?
                                "Login"
                                :
                                (authMode === "forgot" ?
                                    "Reset password"
                                    :
                                    (authMode === "register" ?
                                        "Register"
                                        :
                                        "Verify"
                                    )
                                )
                        }
                    </Button>
                    {
                        authMode == "otp" &&
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            onClick={e => {
                                setOtpCode("");
                                signUp(e);
                            }}
                        >
                            Resend
                        </Button>
                    }
                    <Link
                        href="#"
                        variant="body2"
                        onClick={changeAuthMode}
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                        }}>
                        {authMode == "login" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </Link>
                </Box>
            }
        </Box >
    );
}
