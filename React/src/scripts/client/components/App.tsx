import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ContentArea from './ContentArea';

import { Box, ButtonGroup, Collapse, FormControlLabel, IconButton, List, ListItem, ListItemText, Switch, ThemeProvider, Tooltip } from '@mui/material';
import React, { useState, useEffect, useRef } from 'react';
import { Relay, Event } from 'nostr-tools';

import { createTheme } from '@mui/material/styles';
import { blue } from '@mui/material/colors';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { NostrUser } from '../nostr/NostrUser';
import { NostrUtilities } from '../nostr/NostrUtilities';
import { NostrCustomEvent } from '../nostr/NostrCustomEvent';
import { NostrCustomEventProcessor } from '../nostr/NostrCustomEventProcessor';
import { Subscription } from 'nostr-tools/lib/types/relay';
import './../../../styles/App.css';

/////////////////////////////////////////////////////////////////////////////
//
// GLOBALS
//
/////////////////////////////////////////////////////////////////////////////

const enum LocalStorageKeys {
  useLocalStorage = 'useLocalStorage',
  //
  nostrUser = 'nostrUser',
  //
  messagesIsFiltered = 'messagesIsFiltered',
  eventMode = 'eventMode',
  //
  isUsingNostrConnect = 'isUsingNostrConnect',
  aboutSectionIsOpen = 'aboutSectionIsOpen',
  outputSectionIsOpen = 'outputSectionIsOpen',
  inputSectionIsOpen = 'inputSectionIsOpen',
  messageIsEncrypted = 'messageIsEncrypted',
  relayUrl = 'relayUrl',
}
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: Event): Promise<Event>;
      nip04?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
      };
    };
  }
}

const enum EventMode {
  Null,
  Message,
}

const App: React.FC = () => {
  /////////////////////////////////////////////////////////////////////////////
  //
  // THEME
  //
  /////////////////////////////////////////////////////////////////////////////
  const theme = createTheme({
    palette: {
      primary: {
        light: blue[300],
        main: blue[500],
        dark: blue[700],
      },
      secondary: {
        light: blue[100],
        main: blue[200],
        dark: blue[300],
      },
    },
  });

  /////////////////////////////////////////////////////////////////////////////
  //
  // STATE
  //
  /////////////////////////////////////////////////////////////////////////////
  const [useLocalStorage, setUseLocalStorage] = useState<boolean>(() => {
    const stored = localStorage.getItem(LocalStorageKeys.useLocalStorage);
    return stored ? JSON.parse(stored) : true;
  });
  //

  const [messagesFiltered, setMessagesFiltered] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Event[]>([]);
  const [nextMessage, setNextMessage] = useState('');

  const [messagesIsFiltered, setMessagesIsFiltered] = useState<boolean>(() => {
    const stored = localStorage.getItem(LocalStorageKeys.messagesIsFiltered);
    return useLocalStorage && stored ? JSON.parse(stored) : false;
  });
  const [messageIsEncrypted, setMessageIsEncrypted] = useState<boolean>(() => {
    const stored = localStorage.getItem(LocalStorageKeys.messageIsEncrypted);
    return useLocalStorage && stored ? JSON.parse(stored) : false;
  });
  const [relay, setRelay] = useState<Relay | null>(null);
  const [relayUrl, setRelayUrl] = useState(() => {
    const stored = localStorage.getItem(LocalStorageKeys.relayUrl);
    return useLocalStorage && stored ? JSON.parse(stored) : false;
  });

  ///////////////////////////////////////////

  const [nostrUser, setNostrUser] = useState<NostrUser | undefined>(() => {
    const stored = localStorage.getItem(LocalStorageKeys.nostrUser);
    if (stored == 'undefined') {
      console.log('TODO: Debug why this is happening');
      localStorage.removeItem(LocalStorageKeys.nostrUser);
      return;
    }
    return stored ? NostrUser.fromJsonString(stored) : undefined;
  });

  //////////////////////////////////////////
  const [extensionError, setExtensionError] = useState<string | null>(null);
  const [isUsingNostrConnect, setIsUsingNostrConnect] = useState<boolean>(() => {
    const stored = localStorage.getItem(LocalStorageKeys.isUsingNostrConnect);
    return useLocalStorage && stored ? JSON.parse(stored) : false;
  });

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const appIsMounted = useRef(false);

  const [aboutSectionIsOpen, setAboutSectionIsOpen] = useState(() => {
    const stored = localStorage.getItem(LocalStorageKeys.aboutSectionIsOpen);
    return useLocalStorage && stored ? JSON.parse(stored) : true;
  });
  const [inputSectionIsOpen, setInputSectionIsOpen] = useState(() => {
    const stored = localStorage.getItem(LocalStorageKeys.inputSectionIsOpen);
    return useLocalStorage && stored ? JSON.parse(stored) : true;
  });
  const [outputSectionIsOpen, setOutputSectionIsOpen] = useState(() => {
    const stored = localStorage.getItem(LocalStorageKeys.outputSectionIsOpen);
    return useLocalStorage && stored ? JSON.parse(stored) : true;
  });

  const [eventMode, setEventMode] = useState<EventMode>(() => {
    const stored = localStorage.getItem(LocalStorageKeys.eventMode);
    return useLocalStorage && stored ? JSON.parse(stored) : EventMode.Message;
  });

  /////////////////////////////////////////////////////////////////////////////
  //
  // REFS
  //
  /////////////////////////////////////////////////////////////////////////////
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const displayedMessages = messagesIsFiltered ? messagesFiltered : messages;

  /////////////////////////////////////////////////////////////////////////////
  //
  // INITIALIZATION
  //
  /////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    // NOTE: This effect may run twice in development mode due to React Strict Mode.
    // This is intentional and helps identify potential issues. It won't occur in production.
    // HACK: This is a workaround to prevent the app from running twice in development mode.
    if (!appIsMounted.current) {
      appIsMounted.current = true;
      return;
    }
    console.log('App mounted');

    const initializeApp = async () => {
      //Always
      await randomizeMessage();
      //Sometimes
      if (!useLocalStorage) {
        await randomizeRelay();
        if (!isUsingNostrConnect) {
          await randomizeNostrUser();
        }
      } else {
        await connectToRelay(relayUrl);
      }
    };

    initializeApp().catch(console.error);

    return () => {
      console.log('App unmounted');
    };
  }, []); // Empty dependency array ensures this runs only once per mount/unmount

  /////////////////////////////////////////////////////////////////////////////
  //
  // HOOKS
  //
  /////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (relay && nostrUser && nostrUser?.publicKey) {
      subscribeToRelay();
    } else {
      unsubscribeFromRelay();
    }
  }, [relay, nostrUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, messagesFiltered, messagesIsFiltered]);

  useEffect(() => {
    const filtered = messages.filter((msg) => msg.pubkey === nostrUser?.publicKey);
    setMessagesFiltered(filtered);
  }, [messages, nostrUser]);

  useEffect(() => {
    if (useLocalStorage) {
      localStorage.setItem(LocalStorageKeys.messageIsEncrypted, JSON.stringify(messageIsEncrypted));
    }
  }, [messageIsEncrypted, useLocalStorage]);

  useEffect(() => {
    if (useLocalStorage && nostrUser !== undefined) {
      localStorage.setItem(LocalStorageKeys.nostrUser, nostrUser.toJsonString());
    } else {
      localStorage.removeItem(LocalStorageKeys.nostrUser);
    }
  }, [nostrUser, useLocalStorage]);

  useEffect(() => {
    if (useLocalStorage) {
      localStorage.setItem(LocalStorageKeys.isUsingNostrConnect, JSON.stringify(isUsingNostrConnect));
    }
  }, [isUsingNostrConnect, useLocalStorage]);

  useEffect(() => {
    if (useLocalStorage) {
      localStorage.setItem(LocalStorageKeys.messagesIsFiltered, JSON.stringify(messagesIsFiltered));
    }
  }, [messagesIsFiltered, useLocalStorage]);

  useEffect(() => {
    if (useLocalStorage) {
      localStorage.setItem(LocalStorageKeys.relayUrl, JSON.stringify(relayUrl));
    }
  }, [relayUrl, useLocalStorage]);

  useEffect(() => {
    if (!useLocalStorage) {
      localStorage.clear();

      setMessagesIsFiltered(false);
      setMessageIsEncrypted(false);
      setIsUsingNostrConnect(false);
      setNostrUser(undefined);
    }
    localStorage.setItem(LocalStorageKeys.useLocalStorage, JSON.stringify(useLocalStorage));
  }, [useLocalStorage]);

  /////////////////////////////////////////////////////////////////////////////
  //
  // FUNCTIONS
  //
  /////////////////////////////////////////////////////////////////////////////

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const connectToNostr = async () => {
    setExtensionError(null);
    try {
      if (typeof window.nostr === 'undefined') {
        throw new Error('Nostr extension not found. Please install a Nostr extension.');
      }

      const pubKey = await window.nostr.getPublicKey();
      const nostrUser = new NostrUser(pubKey);
      setNostrUser(nostrUser);
    } catch (err) {
      setExtensionError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const disconnectFromNostr = () => {
    setNostrUser(undefined);
    if (useLocalStorage) {
      localStorage.removeItem(LocalStorageKeys.nostrUser);
    }
  };

  const randomizeNostrUser = () => {
    const nostrUser: NostrUser = new NostrUser();
    setNostrUser(nostrUser);
  };

  const verifyUserKey = () => {
    nostrUser?.publicKey && window.open(`https://primal.net/p/${nostrUser.publicKey}`, '_blank');
  };

  const randomizeRelay = async () => {
    const relays = ['wss://ch.purplerelay.com', 'wss://ir.purplerelay.com'];
    let nextRelay = relays[0];

    //If we have multiple options, be sure to pick a new
    if (relays.length > 1) {
      while (nextRelay === relayUrl) {
        nextRelay = relays[Math.floor(Math.random() * relays.length)];
      }
    }
    if (nextRelay) {
      await setRelayUrl(nextRelay);
      await connectToRelay(nextRelay);
    } else {
      console.error('No relay found');
    }
  };

  const isIncomingEventContentValid = (content: String): boolean => {
    const blacklist = ['tracking strings detected and removed'];
    content = content.toLowerCase();
    return !blacklist.some((item) => content.includes(item.toLowerCase()));
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  const formatEventContentLine1 = (event: Event): React.ReactNode => {
    const content = event.content;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const imageRegex = /(https?:\/\/.*\.(?:png|jpg|gif|jpeg))/i;

    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        if (imageRegex.test(part)) {
          return <img key={index} src={part} alt="content" style={{ maxWidth: '100%', height: 'auto' }} />;
        } else {
          return (
            <a key={index} href={part} target="_blank" rel="noopener noreferrer">
              {part}
            </a>
          );
        }
      } else {
        return part;
      }
    });
  };

  const formatEventContentLine2 = (event: Event): React.ReactNode => {
    const encrypted = event.tags.some((tag) => tag[0] === 'p') ? '🔐' : '🔓';
    return (
      <Typography variant="body2">
        {encrypted} From <b>{NostrUtilities.formatPublicKeyShort(event.pubkey)}</b> At <b>{formatTimestamp(event.created_at)}</b>
      </Typography>
    );
  };

  const unsubscribeFromRelay = () => {
    if (subscription && !subscription.closed) {
      subscription.close();
      setSubscription(null);
      console.log('Relay Unsubscribe Complete');
    }
  };

  const subscribeToRelay = async () => {
    if (!relay) return;

    if (subscription && !subscription.closed) {
      unsubscribeFromRelay();
    }

    const sub = relay.subscribe(
      [
        {
          kinds: [1, 4],
          limit: 20,
        },
      ],
      {
        onevent(event) {
          //MESSAGE
          if (isIncomingEventContentValid(event.content)) {
            setMessages((prevMessages) => {
              const messageExists = prevMessages.some((msg) => msg.id === event.id);
              if (!messageExists) {
                const updatedMessages = [...prevMessages, event];
                return updatedMessages.slice(-10);
              }
              return prevMessages;
            });
          }
        },

        oneose() {
          console.log('Relay Subscribe Complete');
        },
      },
    );

    setSubscription(sub);
  };

  const connectToRelay = async (nextRelay: string) => {
    const newRelay = new Relay(nextRelay);
    try {
      await newRelay.connect();
      console.log(`Connected to ${nextRelay}`);
      setRelay(newRelay);

      await subscribeToRelay();
    } catch (error) {
      console.error('Failed to connect to relay:', error);
    }
  };

  const verifyRelay = () => {
    const formattedRelayUrl = relayUrl.replace('wss://', 'https://');
    formattedRelayUrl && window.open(`${formattedRelayUrl}`, '_blank');
  };

  const refreshMessages = () => {
    setMessages([]);
    setMessagesFiltered([]);
    unsubscribeFromRelay();
    subscribeToRelay();
  };

  const togglemessagesIsFiltered = () => {
    setMessagesIsFiltered((prev) => !prev);
  };

  const toggleMessageIsEncrypted = () => {
    setMessageIsEncrypted((prev) => !prev);
  };

  const toggleIsUsingNostrConnect = () => {
    setExtensionError('');
    setNostrUser(undefined);
    setIsUsingNostrConnect((prev) => !prev);
  };

  const toggleUseLocalStorage = () => {
    setUseLocalStorage((prev) => !prev);
  };

  /////////////////////////////////////////////////////////////////////////////
  //
  // EVENT HANDLERS
  //
  /////////////////////////////////////////////////////////////////////////////

  //TODO: this is not editable so,... needed?
  const handleMessageNewInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNextMessage(event.target.value);
  };

  const randomizeMessage = async () => {
    const hellos = ['Hello', 'Greetings', 'Salutations'];
    const worlds = ['World', 'People', 'Universe'];

    const hello = hellos[Math.floor(Math.random() * hellos.length)];
    const world = worlds[Math.floor(Math.random() * worlds.length)];
    const number = Math.floor(Math.random() * 100); //make always 3 digits
    const randomMessageNew = `${hello}, ${world}! ...${number}`;
    setNextMessage(randomMessageNew);
  };

  const sendEventMessageAsync = async () => {
    setEventMode(EventMode.Message);
    await sendEventAsync(nextMessage);
    setNextMessage('');
  };

  const sendEventAsync = async (contentText) => {
    if (contentText.trim() === '') {
      console.error('contentText is not set');
      return;
    }

    if (!nostrUser || !nostrUser?.publicKey) {
      console.error('Must have userKeyPublic first.');
      return;
    }

    if (!isUsingNostrConnect && (!nostrUser || !nostrUser?.privateKey)) {
      console.error('Private key is not set and Nostr Connect is not enabled');
      return;
    }

    if (!relay) {
      console.error('Relay is not connected');
      return;
    }

    try {
      console.log(`Sending message to ${relayUrl}`);

      let content: string = contentText;
      if (messageIsEncrypted) {
        if (isUsingNostrConnect) {
          if (NostrCustomEventProcessor.hasNostrConnect()) {
            throw new Error('Nostr extension does not support NIP-04 encryption.');
          }
          content = await NostrCustomEventProcessor.encryptWithNostrConnectAsync(contentText, nostrUser!.publicKey);
        } else if (nostrUser!.privateKey) {
          content = await NostrCustomEventProcessor.encryptAsync(contentText, nostrUser!.publicKey, nostrUser!.privateKey);
        } else {
          throw new Error('Unable to encrypt message: No private key available.');
        }
      }

      let nostrCustomEvent: NostrCustomEvent = new NostrCustomEvent();
      nostrCustomEvent.created_at = Math.floor(Date.now() / 1000);
      nostrCustomEvent.pubkey = nostrUser!.publicKey;
      nostrCustomEvent.kind = messageIsEncrypted ? 4 : 1;

      //Tags --------------------------------------------
      nostrCustomEvent.tags = [];
      if (messageIsEncrypted) {
        nostrCustomEvent.tags.push(['p', nostrUser!.publicKey]);
      }

      // Modes --------------------------------------------
      switch (eventMode) {
        case EventMode.Message:
          //
          //Keep this as content
          nostrCustomEvent.content = content;
          break;
        default:
          console.error('Unknown eventMode');
      }

      if (isUsingNostrConnect) {
        if (!NostrCustomEventProcessor.hasNostrConnect()) {
          throw Error('Nostr extension does not support NIP-04 encryption.');
        }
        nostrCustomEvent = await NostrCustomEventProcessor.signEventAsync(nostrCustomEvent);
      } else if (nostrUser!.privateKey) {
        nostrCustomEvent = NostrCustomEventProcessor.finalizeEvent(nostrCustomEvent, nostrUser!.privateKey);
      } else {
        throw new Error('Unable to sign event: No private key available.');
      }

      let isVerified = NostrCustomEventProcessor.verifyEvent(nostrCustomEvent);
      if (!isVerified) {
        console.error('Event is not valid');
        return;
      }

      await relay.publish(nostrCustomEvent);
      console.log('Message sent:', nostrCustomEvent);

      if (eventMode == EventMode.Message) {
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, { ...nostrCustomEvent, content: content }];
          return updatedMessages.slice(-10);
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleInputSectionToggle = () => {
    setInputSectionIsOpen(!inputSectionIsOpen);
    if (useLocalStorage) {
      //TODO: This works, but why do I store !value?
      localStorage.setItem(LocalStorageKeys.inputSectionIsOpen, JSON.stringify(!inputSectionIsOpen));
    }
  };

  const handleOutputSectionToggle = () => {
    setOutputSectionIsOpen(!outputSectionIsOpen);
    if (useLocalStorage) {
      //TODO: This works, but why do I store !value?
      localStorage.setItem(LocalStorageKeys.outputSectionIsOpen, JSON.stringify(!outputSectionIsOpen));
    }
  };

  const handleAboutSectionToggle = () => {
    setAboutSectionIsOpen(!aboutSectionIsOpen);
    if (useLocalStorage) {
      //TODO: This works, but why do I store !value?
      localStorage.setItem(LocalStorageKeys.aboutSectionIsOpen, JSON.stringify(!aboutSectionIsOpen));
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  //
  // RENDER
  //
  /////////////////////////////////////////////////////////////////////////////
  return (
    <ThemeProvider theme={theme}>
      <div className="app-container">
        <Box className="app">
          <Box>
            {/*   
            /////////////////////////////////////////////////////////////////////////////
            //
            // ABOUT
            //
            ///////////////////////////////////////////////////////////////////////////// 
            */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={handleAboutSectionToggle} className="collapse-toggle">
                <ExpandMoreIcon style={{ transform: aboutSectionIsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.3s' }} />
                <Typography variant="h5">About</Typography>
              </IconButton>
            </div>
            <Collapse in={aboutSectionIsOpen} className="collapse">
              <ContentArea title="About" className="content-area">
                <div>
                  <Typography variant="body1">Send and receive encrypted messages using the Nostr web3 protocol.</Typography>
                  <Typography variant="body1" component="div" sx={{ marginBottom: 2 }}></Typography>
                  <Typography variant="body1" component="div" sx={{ marginBottom: 2 }}></Typography>
                  <Typography variant="body1">
                    Technologies: <a href="https://reactjs.org/">React</a>, <a href="https://mui.com/">Material-UI</a>, and{' '}
                    <a href="https://github.com/fiatjaf/nostr-tools">Nostr Tools</a>.
                  </Typography>
                  <Typography variant="body1" component="div" sx={{ marginBottom: 2 }}></Typography>
                  <Typography variant="body1" component="div" sx={{ marginBottom: 2 }}></Typography>
                  <Typography variant="body1">
                    Source: <a href="https://github.com/SamuelAsherRivello/react-nostr-chat">GitHub.com/SamuelAsherRivello/react-nostr-chat</a>.
                  </Typography>
                </div>
                <Box className="content-area-nav">
                  <ButtonGroup className="content-area-button-group"></ButtonGroup>
                  <Tooltip title="Use Local Storage">
                    <FormControlLabel
                      control={<Switch checked={useLocalStorage} onChange={toggleUseLocalStorage} name="useLocalStorage" color="primary" />}
                      label="Use LocalStorage"
                    />
                  </Tooltip>
                </Box>
              </ContentArea>
            </Collapse>

            {/*   
          /////////////////////////////////////////////////////////////////////////////
          //
          // INPUT
          //
          ///////////////////////////////////////////////////////////////////////////// 
          */}

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={handleInputSectionToggle} className="collapse-toggle">
                <ExpandMoreIcon style={{ transform: inputSectionIsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.3s' }} />
                <Typography variant="h5">Input</Typography>
              </IconButton>
            </div>
            <Collapse in={inputSectionIsOpen} className="collapse">
              <ContentArea title="User" className="content-area">
                <TextField
                  className="textField"
                  label="Public Key"
                  value={nostrUser == undefined ? '' : nostrUser?.publicKey}
                  fullWidth={true}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="outlined"
                  margin="normal"
                />
                <Box className="content-area-nav">
                  <ButtonGroup className="content-area-button-group">
                    {isUsingNostrConnect ? (
                      <>
                        <Tooltip title="Connect To Nostr Connect">
                          <span>
                            <Button variant="contained" onClick={connectToNostr} disabled={nostrUser && NostrUtilities.isValidPublicKey(nostrUser?.publicKey)}>
                              Nostr Connect
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Disconnect From Nostr Connect">
                          <span>
                            <Button variant="contained" onClick={disconnectFromNostr} disabled={!nostrUser || !nostrUser!.publicKey} color="primary">
                              Nostr Disconnect
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Verify User Public Key">
                          <span>
                            <Button variant="contained" onClick={verifyUserKey} disabled={!nostrUser || !nostrUser!.publicKey} color="secondary">
                              Verify
                            </Button>
                          </span>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Tooltip title="Randomize User Public Key">
                          <span>
                            <Button onClick={randomizeNostrUser} variant="contained" color="primary">
                              Randomize
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Verify User Public Key">
                          <span>
                            <Button variant="contained" onClick={verifyUserKey} disabled={!nostrUser || !nostrUser?.publicKey} color="secondary">
                              Verify
                            </Button>
                          </span>
                        </Tooltip>
                      </>
                    )}
                  </ButtonGroup>
                  <FormControlLabel
                    control={<Switch checked={isUsingNostrConnect} onChange={toggleIsUsingNostrConnect} name="useNostrConnect" color="primary" />}
                    label="Use Nostr Connect"
                  />
                </Box>
                {extensionError && <Typography color="error">{extensionError}</Typography>}
              </ContentArea>

              <ContentArea title="Relay" className="content-area">
                <TextField
                  label="Url"
                  value={relayUrl}
                  fullWidth={true}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="outlined"
                  margin="normal"
                />
                <Box className="content-area-nav">
                  <ButtonGroup className="content-area-button-group">
                    <Tooltip title="Randomize Relay">
                      <span>
                        <Button variant="contained" onClick={randomizeRelay} color="primary">
                          Randomize
                        </Button>
                      </span>
                    </Tooltip>
                    <Tooltip title="Verify Relay">
                      <span>
                        <Button variant="contained" onClick={verifyRelay} color="secondary">
                          Verify
                        </Button>
                      </span>
                    </Tooltip>
                  </ButtonGroup>
                </Box>
              </ContentArea>

              <ContentArea title="Send Message" className="content-area">
                <Typography>
                  Send a <b>message</b> from{' '}
                  <Typography component="span" fontWeight="bold">
                    {nostrUser && NostrUtilities.formatPublicKeyShort(nostrUser?.publicKey)}
                  </Typography>{' '}
                  to{' '}
                  <Typography component="span" fontWeight="bold">
                    {nostrUser && NostrUtilities.formatPublicKeyShort(nostrUser?.publicKey)}
                  </Typography>{' '}
                  on{' '}
                  <Typography component="span" fontWeight="bold">
                    {relayUrl}
                  </Typography>
                  .
                </Typography>
                <TextField
                  label="New Message"
                  multiline={false}
                  value={nextMessage}
                  onChange={handleMessageNewInputChange}
                  fullWidth={true}
                  variant="outlined"
                  margin="normal"
                />
                <Box className="content-area-nav">
                  <ButtonGroup className="content-area-button-group">
                    <Tooltip title="Send Message">
                      <span>
                        <Button variant="contained" color="primary" onClick={sendEventMessageAsync} disabled={nextMessage.length == 0 || !nostrUser}>
                          Send
                        </Button>
                      </span>
                    </Tooltip>
                    <Tooltip title="Randomize Message">
                      <span>
                        <Button variant="contained" color="secondary" onClick={randomizeMessage} disabled={!nostrUser}>
                          Randomize
                        </Button>
                      </span>
                    </Tooltip>
                  </ButtonGroup>
                  <FormControlLabel
                    control={<Switch checked={messageIsEncrypted} onChange={toggleMessageIsEncrypted} name="messageIsEncrypted" color="primary" />}
                    label="Message Is Encrypted"
                  />
                </Box>
              </ContentArea>
            </Collapse>

            {/*   
          /////////////////////////////////////////////////////////////////////////////
          //
          // OUTPUT
          //
          ///////////////////////////////////////////////////////////////////////////// 
          */}

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={handleOutputSectionToggle} className="collapse-toggle">
                <ExpandMoreIcon style={{ transform: outputSectionIsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.3s' }} />
                <Typography variant="h5">Output</Typography>
              </IconButton>
            </div>
            <Collapse in={outputSectionIsOpen} className="collapse">
              <ContentArea title="List Messages" className="content-area">
                <Box
                  ref={messagesContainerRef}
                  sx={{
                    minHeight: '200px',
                    height: '100%',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    border: '1px solid #ccc',
                    marginBottom: 2,
                  }}
                >
                  <List className="message-list">
                    {displayedMessages.map((msg) => (
                      <ListItem key={msg.id} className="message-list-item">
                        <ListItemText primary={<Typography>{formatEventContentLine1(msg)}</Typography>} secondary={formatEventContentLine2(msg)} />
                      </ListItem>
                    ))}
                    <div ref={messagesEndRef} />
                  </List>
                </Box>
                <Box className="content-area-nav">
                  <ButtonGroup variant="contained" className="content-area-button-group">
                    <Tooltip title="Refresh Message List">
                      <span>
                        <Button variant="contained" color="primary" onClick={refreshMessages}>
                          Refresh
                        </Button>
                      </span>
                    </Tooltip>
                  </ButtonGroup>
                  <FormControlLabel
                    control={<Switch checked={messagesIsFiltered} onChange={togglemessagesIsFiltered} name="messageFilter" color="primary" />}
                    label="Show only my messages"
                  />
                </Box>
              </ContentArea>
            </Collapse>
          </Box>
        </Box>
      </div>
    </ThemeProvider>
  );
};

export default App;
