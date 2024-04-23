import { useState } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { Modal, Input, Select, useNotification } from "web3uikit"
import networkMapping from "../constants/networkMapping.json"
import PatientMedicalRecordSystemAbi from "../constants/PatientMedicalRecordSystem.json"
import NodeRSA from "node-rsa"

export default function AddPatientModal({ isVisible, onClose }) {
    const dispatch = useNotification()
    const { runContractFunction } = useWeb3Contract()
    const [patientAddress, setPatientAddress] = useState("")
    const [patientInfo, setPatientInfo] = useState({})
    const [category, setCategory] = useState("acuteHash")
    const [file, setFile] = useState(null)
    const [fileName, setFileName] = useState("")
    const [cancelDisabled, setCancelDisabled] = useState(false)
    const [okDisabled, setOkDisabled] = useState(false)

    const { chainId: chainHexId, account: doctorAddress } = useMoralis()

    const chainId = chainHexId ? parseInt(chainHexId).toString() : "31337"
    const patientMedicalRecordSystem =
        networkMapping[chainId]?.PatientMedicalRecordSystem[0]

    const handleAddedPatientDetailsSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            title: "Transaction Successful",
            message:
                "Patient Report added Successfully to the blockchain network",
            position: "bottomL",
        })
        onClose && onClose() //closing the modal on success
    }

    // Takes a JS object and returns a json file object
    const generateFileToUpload = async (info) => {
        const infoBlob = new Blob([JSON.stringify(info, null, 2)], {
            type: "application/json",
        })
        return new File([infoBlob], "info.json", { type: "application/json" })
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    const initiateGetPatientDetailsFunction = async () => {
        const getPatientDetailsOptions = {
            abi: PatientMedicalRecordSystemAbi,
            contractAddress: patientMedicalRecordSystem,
            functionName: "getPatientDetails",
            params: {
                _patientAddress: patientAddress,
            },
        }

        // initiating the getPatientDetails function
        await runContractFunction({
            params: getPatientDetailsOptions,
            onError: (error) => {
                console.log(
                    "Error while calling getPatientDetails function",
                    error
                )
            },
            onSuccess: (res) => {
                if (res[2] == false) {
                    console.log("Patient is not registered")
                } else {
                    console.log("Patient is registered")

                    // setting up the patientInfo hash
                    const ipfsInfoHash = res[1]
                    fetch(
                        process.env.NEXT_PUBLIC_PINATA_GATEWAY_DOMAIN +
                            ipfsInfoHash +
                            "/info.json"
                    ) // generic filename
                        .then((response) => {
                            if (!response.ok) {
                                console.error("Couldn't fetch IFPS info")
                            }
                            return response.json()
                        })
                        .then(async (patientInfo) => {
                            console.log(patientInfo)
                            // Move encryption logic here
                            await initiateAddPatientDetailsTransaction(
                                patientInfo
                            )
                            // setPatientInfo(data)
                        })
                        .catch((error) => {
                            console.error("Error fetching IFPS info:", error)
                        })
                }
            },
        })
    }

    const uploadFileToIpfs = async (fileToUpload) => {
        const pinataPinUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        const folder = `${patientAddress}_json`
        const files = [fileToUpload]

        const data = new FormData()

        Array.from(files).forEach((file) => {
            data.append("file", file, `${folder}/${file.name}`)
        })
        const pinataMetadata = JSON.stringify({
            name: `${folder}`,
        })
        data.append("pinataMetadata", pinataMetadata)
        const req = {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
            },
            body: data,
        }

        try {
            const res = await fetch(pinataPinUrl, req)
            console.log(req, res)
            const resData = await res.json()
            console.log(resData)
            return resData.IpfsHash
        } catch (error) {
            console.log(error)
        }
    }

    const initiateAddPatientDetailsTransaction = async (patientInfo) => {
        //Getting the parameters for the transaction
        //we have patientAddress, category and file.
        //we need to encrypt the file and upload the encrypted file to ipfs and get the hash.

        setOkDisabled(true)
        setCancelDisabled(true)

        //uploading file to ipfs
        let fileIpfsHash
        try {
            fileIpfsHash = await uploadFileToIpfs(file)
            console.log("IPFS hash of file: ", fileIpfsHash)
        } catch (e) {
            console.error("unable to upload file to IPFS", e)
        }

        console.log("original file name: ", file.name)

        const fileMetadata = {
            name: fileName,
            originalfileName: file.name,
            dateOfUpload: Date.now(),
            fileIpfsHash: fileIpfsHash,
            doctorAddress: doctorAddress,
        }

        const jsonMetadataFileToUpload = await generateFileToUpload(
            fileMetadata
        )
        const IpfsHash = await uploadFileToIpfs(jsonMetadataFileToUpload)

        // console.log("fileMetadata Hash: ", IpfsHash)     ///-------------
        // console.log("Link: ", `ipfs.infura.io/ipfs/${IpfsHash}`)

        //encrypting the fileMetadata using the public key of the patient
        // console.log("patientPublicKey: ", patientPublicKey)   ///---------
        console.log("Patient Info: ", patientInfo)
        const publicKeyPatient = new NodeRSA(patientInfo.publicKey)
        const encryptedIpfsHash = publicKeyPatient.encrypt(IpfsHash, "base64")

        console.log("encrypted IPFS hash: ", encryptedIpfsHash)

        // Upload the patientInfo again to IPFS
        // by appending the new encryptedIpfsHash to the specific category.
        // call addPatientDetails function with this new patientInfo

        // appending the encryptedIpfsHash to the patientInfo based on category.
        patientInfo[category].push(encryptedIpfsHash)

        const newPatientInfoHash = await uploadFileToIpfs(
            await generateFileToUpload(patientInfo)
        )

        dispatch({
            type: "success",
            title: "IPFS Upload Successful!",
            message:
                "Patient Medical Report Added to IPFS network successfully!",
            position: "bottomL",
        })

        const addPatientDetailsOptions = {
            abi: PatientMedicalRecordSystemAbi,
            contractAddress: patientMedicalRecordSystem,
            functionName: "addPatientDetails",
            params: {
                _patientAddress: patientAddress, //Input by the doctor
                _patientInfo: newPatientInfoHash, //This will be the encrypted IpfsHash of the file Metadata of the file uploaded by the doctor.
                _isUpdate: true,
                options: { gasLimit: 3e6 },
            },
        }

        // initiating the addPatientDetails function
        await runContractFunction({
            params: addPatientDetailsOptions,
            onError: (error) => {
                console.log(
                    "Error while calling addPatientDetails function: ",
                    error
                )
            },
            onSuccess: handleAddedPatientDetailsSuccess,
        })

        setOkDisabled(false)
        setCancelDisabled(false)
    }

    return (
        <Modal
            isVisible={isVisible}
            onCancel={onClose}
            onCloseButtonPressed={onClose}
            onOk={initiateGetPatientDetailsFunction}
            isCancelDisabled={cancelDisabled}
            isOkDisabled={okDisabled}
        >
            <div className="mb-5">
                <Input
                    label="Enter Patient's account address"
                    name="Patient Account Address"
                    type="text"
                    onChange={(event) => {
                        setPatientAddress(event.target.value)
                    }}
                />
            </div>

            <div className="gap-2">
                <Select
                    label="Choose Category"
                    onChange={(option) => {
                        setCategory(option.id)
                    }}
                    options={[
                        {
                            id: "vaccinationHash",
                            label: "Vaccination",
                        },
                        {
                            id: "accidentHash",
                            label: "Accident",
                        },
                        {
                            id: "chronicHash",
                            label: "Chronic",
                        },
                        {
                            id: "acuteHash",
                            label: "Acute",
                        },
                    ]}
                    validation={{
                        required: true,
                    }}
                />
            </div>

            <div className="mt-3 mb-3">
                <label
                    className="block mb-2 text-md text-gray-600 dark:text-gray-300 font-semibold ml-1"
                    htmlFor="file_input"
                >
                    Upload file
                </label>

                <input
                    className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                    aria-describedby="file_input_help"
                    id="file_input"
                    type="file"
                    onChange={(event) => {
                        setFile(event.target.files[0])
                    }}
                />
                <p
                    className="mt-1 text-sm text-gray-500 dark:text-gray-300"
                    id="file_input_help"
                >
                    Upload the Patient Report to be encrypted and stored on the
                    blockchain.
                </p>
                <div className="mt-5 mb-5">
                    <Input
                        label="Enter the file name"
                        name="File Name"
                        type="text"
                        onChange={(event) => {
                            setFileName(event.target.value)
                        }}
                    />
                </div>
            </div>
        </Modal>
    )
}
