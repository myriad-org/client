import truncatStr from "../utils/truncateString"
import timestampToDate from "../utils/timestampToDate"
import { useState, useEffect } from "react"
import ListMedicalFiles from "./ListMedicalFiles"
import { Modal, useNotification } from "web3uikit"
import NodeRSA from "node-rsa"

const fetcher = (...args) => fetch(...args).then((res) => res.json())

export default function PatientProfile({ patientInfo }) {
    const dispatch = useNotification()
    const [privateKey, setPrivateKey] = useState("")
    const [showModal, setShowModal] = useState(false)
    const [showFiles, setShowFiles] = useState(false)
    const [haveVaccinationFile, setHaveVaccinationFile] = useState(
        patientInfo?.vaccinationHash &&
            Boolean(patientInfo.vaccinationHash.length)
    )
    const [haveChronicFile, setHaveChronicFile] = useState(
        patientInfo?.chronicHash && Boolean(patientInfo.chronicHash.length)
    )
    const [haveAccidentFile, setHaveAccidentFile] = useState(
        patientInfo?.accidentHash && Boolean(patientInfo.accidentHash.length)
    )
    const [haveAcuteFile, setHaveAcuteFile] = useState(
        patientInfo?.acuteHash && Boolean(patientInfo.acuteHash.length)
    )
    const [iscorrectlyDecrypted, setIsCorrectlyDecrypted] = useState(true)
    const [showErrorModal, setShowErrorModal] = useState(!iscorrectlyDecrypted)

    useEffect(() => {
        setHaveVaccinationFile(patientInfo?.vaccinationHash?.length)
        console.log("Vaccination Hash: ", patientInfo?.vaccinationHash)
        setHaveChronicFile(patientInfo?.chronicHash?.length)
        console.log("Chronic Hash: ", patientInfo?.chronicHash)
        setHaveAccidentFile(patientInfo?.accidentHash?.length)
        console.log("Accident Hash: ", patientInfo?.accidentHash)
        setHaveAcuteFile(patientInfo?.acuteHash?.length)
        console.log("Acute Hash: ", patientInfo?.acuteHash)
    }, [patientInfo])

    const handleClickFetchPrivateKey = () => {
        fetchPrivateKey().catch((error) => {
            console.error("Error fetching private key:", error)
        })
        setShowModal(true)
    }

    const onClose = () => {
        setShowErrorModal(false)
        setShowFiles(false)
    }
    const decryptHash = (encryptedHash) => {
        console.log(encryptedHash)
        const key_private = new NodeRSA(privateKey)
        const decryptedHash = key_private.decrypt(encryptedHash, "utf8")
        console.log(decryptedHash)
        return decryptedHash
    }

    const [decryptedVaccinationHash, setDecryptedVaccinationHash] = useState([])
    const [decryptedChronicHash, setDecryptedChronicHash] = useState([])
    const [decryptedAccidentHash, setDecryptedAccidentHash] = useState([])
    const [decryptedAcuteHash, setDecryptedAcuteHash] = useState([])

    const handleOkPressed = async () => {
        //decrypting the IPFS hashes and storing decrypted IPFS file metadatas in the same array
        // console.log("Encrypted vaccinationHash popo:", vaccinationHash)
        console.log("Fetching the private key")

        try {
            haveVaccinationFile &&
                setDecryptedVaccinationHash(
                    patientInfo?.vaccinationHash?.map((encryptedHash) => {
                        return decryptHash(encryptedHash)
                    })
                )

            haveAccidentFile &&
                setDecryptedAccidentHash(
                    patientInfo?.accidentHash?.map((encryptedHash) => {
                        return decryptHash(encryptedHash)
                    })
                )

            haveChronicFile &&
                setDecryptedChronicHash(
                    patientInfo?.chronicHash?.map((encryptedHash) => {
                        return decryptHash(encryptedHash)
                    })
                )
            haveAcuteFile &&
                setDecryptedAcuteHash(
                    patientInfo?.acuteHash?.map((encryptedHash) => {
                        return decryptHash(encryptedHash)
                    })
                )
        } catch (e) {
            console.log("Error while trying to decrypt: ", e)
            setIsCorrectlyDecrypted(false)
            setShowErrorModal(true)
            setShowModal(false)
        }

        //If it has no files in any category
        if (
            !(
                haveAccidentFile ||
                haveChronicFile ||
                haveAcuteFile ||
                haveVaccinationFile
            )
        ) {
            console.log("patientInfo: ", patientInfo)
            dispatch({
                type: "warning",
                title: "No Files Found",
                message: "You don't have any medical file in the database yet!",
                position: "bottomL",
            })
            showModal && setShowModal(false)
            return
        } else {
            dispatch({
                type: "success",
                title: "File Decryption Process Over",
                position: "bottomL",
            })
            setShowFiles(true)
            setShowModal(false)
            console.log("Files Encryption was Successful")
        }
    }
    // console.log("Decrypted Vaccination Hash: ", decryptedVaccinationHash)

    function readFileContent(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject("No file provided.")
            }

            if (!file.name.endsWith(".txt")) {
                reject("Invalid file format. Only .txt files are supported.")
            }

            const reader = new FileReader()

            reader.onload = (event) => {
                const content = event.target.result
                resolve(content)
            }

            reader.onerror = () => {
                reject("Error reading file.")
            }

            reader.readAsText(file)
        })
    }

    // Read the private key from ~/.myriad-secrets/privateKey-{account}.pem
    // file stored at the time of registration
    // Function to fetch the private key from the file system
    async function fetchPrivateKey() {
        try {
            if (!patientInfo || !patientInfo.account) {
                console.error("Patient information incomplete.")
                return
            }
    
            // Request access to the file system
            const directoryHandle = await window.showDirectoryPicker()
    
            // Access the privateKey file
            const fileHandle = await directoryHandle.getFileHandle(
                `privateKey-${patientInfo.account.toLowerCase()}.pem`
            )
    
            // Read the content of the privateKey file
            const privateKeyContent = await readFileContent(fileHandle)
    
            // Set the private key to the state
            setPrivateKey(privateKeyContent)
        } catch (error) {
            console.error("Error fetching private key:", error)
        }
    }
    

    return (
        <div>
            <div>
                <div>
                    <Modal
                        isVisible={showModal}
                        onCancel={() => {
                            setPrivateKey("")
                            setShowModal(false)
                        }}
                        onCloseButtonPressed={() => {
                            setPrivateKey("")
                            setShowModal(false)
                        }}
                        onOk={handleOkPressed}
                        // isOkDisabled={!Boolean(privateKey)}
                    >
                        <div className="mt-b mb-8">
                            <div className="mb-5 mt-3">
                                <span className="font-semibold">
                                    Important:
                                </span>
                                Copy-Paste your Private Key from the text file
                                downloaded while registering to the system. We
                                will not store it and only use to decrypt the
                                IPFS hashes locally. - trying to read file
                                automatically.
                            </div>

                            {/* <input
                                type="file"
                                id="fileInput"
                                accept=".txt"
                                // required
                                onChange={async (event) => {
                                    const privateKey = await readFileContent(
                                        event.target.files[0]
                                    )
                                    setPrivateKey(privateKey)
                                }}
                            /> */}
                        </div>
                    </Modal>
                </div>
                <div className="md:w-fit md:mx-auto w-full mx-auto bg-sky-200 bg-opacity-80 mt-10 p-5 rounded-lg hover:bg-opacity-100">
                    <div className="card p-4 hover">
                        <div className="mb-1">
                            <span>
                                <span className="font-sans md:text-xl font-medium hover:underline">
                                    Name:{" "}
                                </span>
                                <span className="font-serif md:text-xl font-normal">
                                    {patientInfo?.name}
                                </span>
                            </span>
                            <span className="badge badge-warning ml-5 md:p-2.5">
                                {patientInfo?.bloodGroup}
                            </span>
                        </div>
                        <div className="mb-1">
                            <span className="font-sans md:text-xl font-medium hover:underline">
                                Patient Account Address
                            </span>
                            :{" "}
                            <a
                                className="badge ml-3 md:p-2 px-4"
                                title="view on etherscan"
                                target="_blank"
                                href={
                                    "https://sepolia.etherscan.io/address/" +
                                    patientInfo?.patientAddress
                                }
                            >
                                {truncatStr(patientInfo?.patientAddress, 20)}
                            </a>
                        </div>
                        <div className="mb-1">
                            <span className="font-sans md:text-xl font-medium hover:underline">
                                Date of Birth
                            </span>
                            :{" "}
                            <a className="badge badge-success ml-3 md:p-2 px-4">
                                {timestampToDate(patientInfo?.dob)}
                            </a>
                        </div>
                        <div className="mb-1">
                            <span className="font-sans md:text-xl font-medium hover:underline">
                                Date of Registration
                            </span>
                            :{" "}
                            <a className="badge badge-accent ml-3 md:p-2 px-4">
                                {timestampToDate(patientInfo?.timestamp)}
                            </a>
                        </div>
                        {/* <div>
                            <span className="font-sans md:text-xl font-medium hover:underline">
                                Phone Number
                            </span>
                            :{" "}
                            <span className="badge badge-warning badge-accent">
                                {phoneNumber}
                            </span>
                        </div> */}
                    </div>
                </div>
                <div>
                    {!showFiles ? (
                        <div className="text-center">
                            <button
                                className="btn btn-primary btn-md mt-8"
                                onClick={handleClickFetchPrivateKey}
                            >
                                View Medical Files
                            </button>
                        </div>
                    ) : iscorrectlyDecrypted ? (
                        <div>
                            <ListMedicalFiles
                                vaccinationHash={[...decryptedVaccinationHash]}
                                acuteHash={[...decryptedAcuteHash]}
                                accidentHash={[...decryptedAccidentHash]}
                                chronicHash={[...decryptedChronicHash]}
                            />
                        </div>
                    ) : (
                        <div>
                            <Modal
                                isVisible={showErrorModal}
                                okText="close"
                                onCancel={onClose}
                                onCloseButtonPressed={onClose}
                                onOk={onClose}
                                title="Decryption Failed"
                            >
                                <p
                                    style={{
                                        fontWeight: 600,
                                        marginRight: "1em",
                                        textAlign: "center",
                                    }}
                                >
                                    File Decryption Unsuccessful due to
                                    Incorrect Private Key
                                </p>
                            </Modal>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
