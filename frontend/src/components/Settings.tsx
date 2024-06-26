import { Accordion, AccordionDetails, AccordionSummary, Avatar, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, FormGroup, FormHelperText, IconButton, InputAdornment, InputLabel, OutlinedInput, TextField, Typography } from "@mui/material";
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import secureLocalStorage from "react-secure-storage";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { ChangeEvent, useEffect, useState } from "react";
import { AxiosInstance } from "axios";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import LaunchIcon from '@mui/icons-material/Launch';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import "../style/Settings.scss";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { userStats } from "../interfaces";
import CheckBox from "@mui/icons-material/CheckBox";

function UsernameDialog(props: {
    open: boolean,
    close: () => void,
    username: string,
    requestor: AxiosInstance,
    printError: (msg: any) => void,
    confirmCallBack: () => void;
}) {
    const [authenticatedUserId, setAuthenticatedUserId] = useState<string>();
    const [newUsername, setNewUsername] = useState<string>(props.username);
    const [newUsernameError, setNewUsernameError] = useState<string>();

    const changeUsername = (newUsername: string): Promise<void> => {
        return new Promise((accept, reject) => {
            if (authenticatedUserId === undefined) {
                props.printError("Could not get user ID");
                return reject();
            }
            props.requestor.put("/user", {
                id: authenticatedUserId,
                username: newUsername,
            })
                .then(_res => {
                    secureLocalStorage.setItem("plant-it-username", newUsername);
                    accept();
                })
                .catch(err => {
                    props.printError(err);
                    reject();
                });
        });
    };

    const checkUsernameConstraintThenExecThenCallback = (): void => {
        if (newUsername.length > 20 || newUsername.length < 3) {
            setNewUsernameError("username length must be between 3 and 20");
            return;
        }
        props.requestor.get(`/user/username/${newUsername}/_available`)
            .then(res => {
                if (res.data) {
                    changeUsername(newUsername)
                        .then(props.confirmCallBack)
                        .catch(props.printError);
                } else {
                    setNewUsernameError("username already taken");
                }
            })
            .catch(props.printError);
    };

    const changeNewUsername = (value: string): void => {
        setNewUsernameError(undefined);
        setNewUsername(value);
    };

    const getAuthenticatedUserID = (): void => {
        props.requestor.get("/user")
            .then(res => {
                setAuthenticatedUserId(res.data.id);
            })
            .catch(props.printError);
    };

    useEffect(() => {
        getAuthenticatedUserID();
    }, []);

    return <Dialog open={props.open} onClose={props.close}>
        <DialogContent>
            <DialogContentText>
                Insert the new username
            </DialogContentText>
            <TextField
                autoFocus
                margin="normal"
                type="text"
                fullWidth
                variant="standard"
                value={newUsername}
                error={newUsernameError != undefined}
                helperText={newUsernameError}
                placeholder="New username"
                required
                onChange={event => changeNewUsername(event.target.value)}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={props.close}>Cancel</Button>
            <Button onClick={checkUsernameConstraintThenExecThenCallback}>Confirm</Button>
        </DialogActions>
    </Dialog>;
}


function EmailDialog(props: {
    open: boolean,
    close: () => void,
    requestor: AxiosInstance,
    printError: (msg: any) => void,
    confirmCallBack: () => void;
}) {
    const [authenticatedUserDetails, setAuthenticatedUserDetails] = useState<{
        id: number,
        username: string,
        email: string
    }>({ id: 42, username: "to-load", email: "to-load" });
    const [currentEmail, setCurrentEmail] = useState<string>();
    const [password, setPassword] = useState<string>();
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [newEmailError, setNewEmailError] = useState<string>();

    const changeEmail = (newEmail: string): Promise<void> => {
        return new Promise((accept, reject) => {
            if (authenticatedUserDetails === undefined) {
                props.printError("Could not get authenticated user details");
                return reject("Could not get authenticated user details");
            }
            props.requestor.put("/user/_email", {
                password: password,
                newEmail: newEmail,
            })
                .then(_res => accept())
                .catch(err => {
                    props.printError(err);
                    reject(err);
                });
        });
    };

    const checkEmailConstraintThenExecThenCallback = (): void => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidEmail = emailRegex.test(authenticatedUserDetails.email);
        if (!isValidEmail) {
            setNewEmailError("invalid email format");
            return;
        }
        props.requestor.get(`/user/email/${authenticatedUserDetails.email}/_available`)
            .then(res => {
                if (res.data) {
                    changeEmail(authenticatedUserDetails.email)
                        .then(props.confirmCallBack)
                        .catch(props.printError);
                } else {
                    setNewEmailError("email already used");
                }
            })
            .catch(props.printError);
    };

    const changeNewEmail = (value: string): void => {
        setNewEmailError(undefined);
        setAuthenticatedUserDetails({ ...authenticatedUserDetails, email: value });
    };

    const getAuthenticatedUserDetails = (): void => {
        props.requestor.get("/user")
            .then(res => {
                setAuthenticatedUserDetails(res.data);
                setCurrentEmail(res.data.email);
            })
            .catch(props.printError);
    };

    useEffect(() => {
        if (!props.open && currentEmail) {
            setAuthenticatedUserDetails({ ...authenticatedUserDetails, email: currentEmail });
        } else {
            getAuthenticatedUserDetails();
        }
    }, [props.open])

    return <Dialog open={props.open} onClose={props.close}>
        <DialogContent>
            <DialogContentText>
                Change the email
            </DialogContentText>
            <FormControl fullWidth margin="normal" variant="outlined" required>
                <InputLabel>Password</InputLabel>
                <OutlinedInput
                    type={showPassword ? 'text' : 'password'}
                    onChange={e => setPassword(e.target.value)}
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
                />
            </FormControl>
            <TextField
                autoFocus
                margin="normal"
                type="text"
                fullWidth
                variant="standard"
                value={authenticatedUserDetails.email}
                error={newEmailError != undefined}
                helperText={newEmailError}
                placeholder="New email"
                required
                onChange={e => changeNewEmail(e.target.value)}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={props.close}>Cancel</Button>
            <Button onClick={checkEmailConstraintThenExecThenCallback}>Confirm</Button>
        </DialogActions>
    </Dialog>;
}


function PasswordDialog(props: {
    open: boolean,
    close: () => void,
    requestor: AxiosInstance,
    printError: (msg: any) => void,
    confirmCallBack: () => void;
}) {
    const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [newPasswordError, setNewPasswordError] = useState<string>();

    const checkPasswordConstraintThenExecThenCallback = (): void => {
        if (newPassword.length > 20 || newPassword.length < 8) {
            setNewPasswordError("password length must be between 8 and 20");
            return;
        }
        props.requestor.put(`/user/_password`, {
            currentPassword: currentPassword,
            newPassword: newPassword,
        })
            .then(props.confirmCallBack)
            .catch(props.printError);
    };

    const changeNewPassword = (value: string): void => {
        setNewPasswordError(undefined);
        setNewPassword(value);
    };


    return <Dialog open={props.open} onClose={props.close}>
        <DialogContent>
            <DialogContentText>
                Insert the new password
            </DialogContentText>
            <FormControl fullWidth margin="normal" variant="outlined" required>
                <InputLabel htmlFor="current-password-input">Current password</InputLabel>
                <OutlinedInput
                    id="current-password-input"
                    type={showCurrentPassword ? 'text' : 'password'}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                edge="end"
                            >
                                {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    }
                    label="Current password"
                />
            </FormControl>
            <FormControl fullWidth margin="normal" variant="outlined" required>
                <InputLabel htmlFor="new-password-input">New password</InputLabel>
                <OutlinedInput
                    id="new-password-input"
                    type={showNewPassword ? 'text' : 'password'}
                    onChange={(e) => changeNewPassword(e.target.value)}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                edge="end"
                            >
                                {showNewPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    }
                    label="New password"
                    error={newPasswordError != undefined}
                />
                {
                    newPasswordError != undefined &&
                    <FormHelperText error>
                        {newPasswordError}
                    </FormHelperText>
                }
            </FormControl>
        </DialogContent>
        <DialogActions>
            <Button onClick={props.close}>Cancel</Button>
            <Button onClick={checkPasswordConstraintThenExecThenCallback}>Confirm</Button>
        </DialogActions>
    </Dialog>;
}


function NotificationDialog(props: {
    open: boolean,
    close: () => void,
    requestor: AxiosInstance,
    printError: (msg: any) => void,
    confirmCallBack: () => void;
}) {
    const [availableDispatcher, setAvailableDispatcher] = useState<string[]>([]);
    const [enabledDispatcher, setEnabledDispatcher] = useState<string[]>([]);

    const setNewDispatchers = (): void => {
        props.requestor.put("/notification-dispatcher", enabledDispatcher)
            .then(props.confirmCallBack)
            .catch(props.printError);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>, name: string): void => {
        const isChecked = e.target.checked;
        if (isChecked) {
            if (!enabledDispatcher.includes(name)) {
                setEnabledDispatcher(prevState => [...prevState, name]);
            }
        } else {
            if (enabledDispatcher.includes(name)) {
                setEnabledDispatcher(prevState =>
                    prevState.filter(item => item !== name)
                );
            }
        }
    };

    useEffect(() => {
        props.requestor.get("/info/notification-dispatchers")
            .then(res => setAvailableDispatcher(res.data))
            .catch(props.printError);
        props.requestor.get("/notification-dispatcher")
            .then(res => setEnabledDispatcher(res.data))
            .catch(props.printError);
    }, []);


    return <Dialog open={props.open} onClose={props.close}>
        <DialogContent>
            <DialogTitle>
                Notification dispatchers
            </DialogTitle>
            <FormGroup>
                {
                    availableDispatcher.map(dispatcher => {
                        return <FormControlLabel
                            control={<Checkbox onChange={e => handleChange(e, dispatcher)} />}
                            label={dispatcher}
                            checked={enabledDispatcher.includes(dispatcher)}
                        />
                    })
                }
            </FormGroup>
        </DialogContent>
        <DialogActions>
            <Button onClick={props.close}>Cancel</Button>
            <Button onClick={setNewDispatchers}>Confirm</Button>
        </DialogActions>
    </Dialog>;
}

function SettingsEntry(props: {
    text: string,
    right: React.JSX.Element,
    onClick?: () => void;
}) {
    return <Box
        sx={{
            backgroundColor: "background.paper",
            borderRadius: "10px",
            display: "flex",
            justifyContent: "space-between",
            padding: "15px",
        }}
        onClick={props.onClick}
    >
        <Box>{props.text}</Box>
        {props.right}
    </Box>;
}

function SettingsHeader(props: {
    username: string;
}) {
    return <Box sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
    }}>
        <Avatar
            alt={props.username}
            src="/static/images/avatar/1.jpg"
            sx={{
                width: "20%",
                height: "auto",
                aspectRatio: 1,
            }}
        />
        <Typography
            variant="body1"
            style={{ fontWeight: 600 }}
        >
            {props.username}
        </Typography>
    </Box>;
}

function StatsSection(props: {
    title: string,
    value: number;
}) {
    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "45%",
            borderRadius: "5px",
            backgroundColor: "background.default",
            padding: "15px",
        }}>
            <Box>
                {props.title}
            </Box>
            <Box>
                {props.value}
            </Box>
        </Box>
    );
}

function Stats(props: {
    requestor: AxiosInstance,
    visibility: boolean,
    printError: (err: any) => void;
}) {
    const [expanded, setExpanded] = useState<boolean>(true);
    const [stats, setStats] = useState<userStats>();
    const [erorr, setError] = useState<boolean>(false);

    useEffect(() => {
        if (props.visibility) {
            props.requestor.get("stats")
                .then(res => {
                    setStats(res.data)
                })
                .catch(err => {
                    setError(true);
                    props.printError(err);
                });
        }
    }, [props.visibility]);

    return (
        <Accordion
            disableGutters
            square
            elevation={0}
            expanded={expanded}
            onChange={(_event: React.SyntheticEvent, newExpanded: boolean) => setExpanded(newExpanded)}
            sx={{
                backgroundColor: "background.paper",
                borderRadius: "10px",
                '&:not(:last-child)': {
                    borderBottom: 0,
                },
                '&:before': {
                    display: 'none',
                },
            }}>
            <AccordionSummary
                expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem', rotate: "90deg" }} />}
                sx={{
                    '&:not(:last-child)': {
                        borderBottom: 0,
                    },
                    '&:before': {
                        display: 'none',
                    },
                }}
            >
                <Box sx={{
                    width: "98%",
                }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: 0,
                        }}
                    >
                        <Typography>Stats</Typography>
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails
                sx={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                }}
            >
                <StatsSection
                    title="Events"
                    value={stats?.diaryEntryCount || 0}
                />
                <StatsSection
                    title="Plants"
                    value={stats?.plantCount || 0}
                />
                <StatsSection
                    title="Species"
                    value={stats?.botanicalInfoCount || 0}
                />
                <StatsSection
                    title="Photos"
                    value={stats?.imageCount || 0}
                />
                {/* <Box sx={{ width: "45%" }} /> */}
            </AccordionDetails>
        </Accordion>
    );
}


export default function Settings(props: {
    requestor: AxiosInstance,
    visibility: boolean,
    printError: (err: any) => void;
}) {
    let navigate: NavigateFunction = useNavigate();
    const username = secureLocalStorage.getItem("plant-it-username") as string;
    const [version, setVersion] = useState<{ current?: string, latest: boolean }>({ latest: true });
    const [usernameDialogOpen, setUsernameDialogOpen] = useState<boolean>(false);
    const [emailDialogOpen, setEmailDialogOpen] = useState<boolean>(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);
    const [notificationDispatcherOpen, setNotificationDispatcherOpen] = useState<boolean>(false);
    const repoLink = "https://github.com/MDeLuise/plant-it";
    const documentationLink = "https://docs.plant-it.org/";
    const repoOpenIssues = "https://github.com/MDeLuise/plant-it/issues/new/choose";
    const repoLastVersion = "https://github.com/MDeLuise/plant-it/releases/latest";

    const logout = (): void => {
        secureLocalStorage.removeItem("plant-it-key");
        navigate("/auth");
    };

    const getVersion = (): void => {
        props.requestor.get("/info/version")
            .then(res => {
                setVersion({ current: res.data.currentVersion, latest: res.data.latest })
            })
            .catch(props.printError);
    };

    const navigateTo = (url: string): void => {
        var anchor = document.createElement('a');
        anchor.href = url;
        anchor.target = "_blank";
        anchor.click();
    };

    useEffect(() => {
        getVersion();
    }, []);

    return <Box sx={{
        display: "flex",
        gap: "10px",
        flexDirection: "column",
    }}>

        <EmailDialog
            open={emailDialogOpen}
            requestor={props.requestor}
            printError={props.printError}
            close={() => setEmailDialogOpen(false)}
            confirmCallBack={() => {
                setEmailDialogOpen(false);
            }}
        />

        <UsernameDialog
            open={usernameDialogOpen}
            requestor={props.requestor}
            printError={props.printError}
            close={() => setUsernameDialogOpen(false)}
            username={username}
            confirmCallBack={() => {
                setUsernameDialogOpen(false);
            }}
        />

        <PasswordDialog
            open={passwordDialogOpen}
            requestor={props.requestor}
            printError={props.printError}
            close={() => setPasswordDialogOpen(false)}
            confirmCallBack={() => {
                setPasswordDialogOpen(false);
            }}
        />

        <NotificationDialog
            open={notificationDispatcherOpen}
            requestor={props.requestor}
            printError={props.printError}
            close={() => setNotificationDispatcherOpen(false)}
            confirmCallBack={() => {
                setNotificationDispatcherOpen(false);
            }}
        />

        <SettingsHeader username={username} />

        <Box className={"setting-section"}>
            <SettingsEntry
                text="Change email"
                right={<ArrowForwardIcon sx={{
                    opacity: .5,
                }} />}
                onClick={() => {
                    setEmailDialogOpen(true);
                }}
            />
            <SettingsEntry
                text="Change username"
                right={<ArrowForwardIcon sx={{
                    opacity: .5,
                }} />}
                onClick={() => {
                    setUsernameDialogOpen(true);
                }}
            />
            <SettingsEntry
                text="Change password"
                right={<ArrowForwardIcon sx={{
                    opacity: .5,
                }} />}
                onClick={() => {
                    setPasswordDialogOpen(true);
                }}
            />
        </Box>

        <Stats
            requestor={props.requestor}
            visibility={props.visibility}
            printError={props.printError}
        />


        <Box className={"setting-section"}>
            <SettingsEntry
                text="Reminder notification"
                right={<ArrowForwardIcon sx={{
                    opacity: .5,
                }} />}
                onClick={() => {
                    setNotificationDispatcherOpen(true);
                }}
            />
        </Box>

        <Box className={"setting-section"}>
            <SettingsEntry
                text="App version"
                right={
                    <Box sx={{ display: 'flex', gap: '10px' }}>
                        <Typography>
                            {version.current}
                        </Typography>
                        {
                            version.latest ||
                            <NewReleasesIcon sx={{ color: "primary.main" }} />
                        }
                    </Box>
                }
                onClick={version.latest ? undefined : () => navigateTo(repoLastVersion)}
            />
            <SettingsEntry
                text="Documentation"
                right={<LaunchIcon sx={{
                    opacity: .5,
                }} />}
                onClick={() => navigateTo(documentationLink)}
            />
            <SettingsEntry
                text="Open source"
                right={<LaunchIcon sx={{
                    opacity: .5,
                }} />}
                onClick={() => navigateTo(repoLink)}
            />
            <SettingsEntry
                text="Report issue"
                right={<LaunchIcon sx={{
                    opacity: .5,
                }} />}
                onClick={() => navigateTo(repoOpenIssues)}
            />
        </Box>
        <Box>
            <Button
                variant="contained"
                color="error"
                fullWidth
                onClick={logout}
                startIcon={<LogoutRoundedIcon />}
            >
                Log out
            </Button>
        </Box>
    </Box>;
}
