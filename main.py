from groq import Groq


from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import io
import os
from google.cloud import vision
import tempfile
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'vision-key.json'

import cv2
import numpy as np
from deepface import DeepFace
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams



# Initialize Qdrant client
qdrant_client = QdrantClient(
    url="QDRANT URL",
    api_key="QDRANT API",
)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'jpg', 'jpeg', 'png'}


app = Flask(__name__)
CORS(app)
examples = [
    {
    "report":"""General Hospital

Discharge Summary

Patient Information
Name: Jane Smith
Age: 64 years
Gender: Female
Medical Record Number (MRN): 123456789
Date of Admission: 10th July 2024
Date of Discharge: 15th July 2024

Admission Diagnosis
Acute Myocardial Infarction

Discharge Diagnosis
Myocardial Infarction, Resolved

Attending Physician
Dr. Michael Roberts, MD, Cardiologist

Reason for Admission
The patient presented with severe chest pain radiating to her left arm, associated with sweating and nausea. Initial ECG showed ST-elevation, and she was diagnosed with an acute myocardial infarction. She was immediately taken to the cath lab for emergency percutaneous coronary intervention (PCI).

Hospital Course and Management
The patient underwent PCI with stent placement to the left anterior descending artery. Post-procedure, she was monitored in the Coronary Care Unit (CCU) for 48 hours. Blood pressure, cardiac enzymes, and ECGs were closely monitored. After stabilization, she was started on a combination of medications including aspirin, clopidogrel, atorvastatin, and metoprolol.

Diagnostic Tests and Procedures

ECG: ST-elevation myocardial infarction (STEMI) involving the anterior wall.

Cardiac Enzymes: Elevated troponin, trended down post-intervention.

Echocardiogram: Showed mild left ventricular dysfunction with an ejection fraction of 50%.

Discharge Medications

Aspirin 81 mg PO daily

Clopidogrel 75 mg PO daily

Atorvastatin 40 mg PO daily

Metoprolol 25 mg PO twice daily

Follow-Up Care

Primary Care: Follow-up with primary care physician in 1 week.

Cardiology: Follow-up in 4 weeks for repeat echocardiogram and medication adjustments.

Lifestyle Modifications: The patient was advised to quit smoking, adopt a heart-healthy diet, and engage in light physical activity.

Monitoring: Daily home monitoring of heart rate and blood pressure.

Patient Education
The patient was educated on the importance of medication compliance and lifestyle changes to prevent further cardiac events. She demonstrated understanding of discharge instructions and the need for cardiac rehabilitation.

Prognosis
The patient’s prognosis is good with adherence to prescribed therapy and lifestyle changes.

Discharging Physician
Dr. Michael Roberts, MD
General Hospital

Physician Signature

Dr. Michael Roberts, MD
Date: 15th July 2024""",

    "result": "Date: 15-07-2024, Issue: Acute Myocardial Infarction, Treatment: PCI, Stent placement, Aspirin, Clopidogrel, Atorvastatin, Metoprolol, smoking cessation, heart-healthy diet, light physical activity."
},

{
    "report":"""City Hospital

Discharge Summary

Patient Information
Name: Alex Johnson
Age: 40 years
Gender: Male
Medical Record Number (MRN): 234567890
Date of Admission: 5th September 2024
Date of Discharge: 12th September 2024

Admission Diagnosis
Severe Pneumonia with Respiratory Failure

Discharge Diagnosis
Pneumonia, Resolved

Attending Physician
Dr. Lisa Martin, MD, Pulmonologist

Reason for Admission
The patient was admitted with high fever, productive cough, and shortness of breath. Chest X-ray revealed extensive consolidation in both lungs. The patient required intubation and mechanical ventilation due to respiratory failure.

Hospital Course and Management
The patient was treated in the ICU with broad-spectrum IV antibiotics (piperacillin/tazobactam), corticosteroids, and mechanical ventilation. Blood cultures and sputum cultures were taken, which grew Streptococcus pneumoniae. Antibiotics were de-escalated to ceftriaxone once sensitivities were confirmed. After 5 days of mechanical ventilation, the patient was extubated and gradually weaned off oxygen support.

Diagnostic Tests and Procedures

Chest X-ray: Bilateral consolidation.

Blood Cultures: Positive for Streptococcus pneumoniae.

Sputum Cultures: Confirmed Streptococcus pneumoniae.

Discharge Medications

Ceftriaxone 1 g IV daily

Prednisone 40 mg PO daily (tapering over 2 weeks)

Albuterol Inhaler PRN

Follow-Up Care

Primary Care: Follow-up with primary care physician in 1 week for a chest X-ray.

Pulmonology: Follow-up in 4 weeks for lung function testing.

Lifestyle Modifications: Avoid exposure to respiratory irritants and secondhand smoke.

Monitoring: Monitor for signs of recurrence such as fever, worsening cough, or shortness of breath.

Patient Education
The patient was instructed on the importance of completing the antibiotic course and using the inhaler as needed. Educational materials were provided on pneumonia prevention, including vaccination.

Prognosis
With adherence to the treatment plan, the patient’s prognosis is good, and the risk of recurrence is low.

Discharging Physician
Dr. Lisa Martin, MD
City Hospital

Physician Signature

Dr. Lisa Martin, MD
Date: 12th September 2024""",

    "result": "Date: 12-09-2024, Issue: Severe Pneumonia with Respiratory Failure, Treatment: IV antibiotics, corticosteroids, mechanical ventilation, oxygen therapy, tapering prednisone, and inhaler use."


}

]

import firebase_admin
from firebase_admin import credentials, firestore

def initialize_firebase():
    """
    Initialize Firebase with credentials
    Returns:
        firestore.Client: Initialized Firestore client
    """
    firebase_config ={
  "FIREBASE CONFIG"
}


    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(firebase_config)
            firebase_admin.initialize_app(cred)
        return firestore.client()
    except Exception as e:
        print(f"Error initializing Firebase: {str(e)}")
        return None


from langchain.prompts import FewShotPromptTemplate, PromptTemplate
from langchain_groq import ChatGroq
from langchain.chains import LLMChain

llm = ChatGroq(
    model="llama-3.1-70b-versatile",
    temperature=1,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    api_key="GROQ API",
)



def discharge_summary_to_json(report_text):

    example_template = """
    Report: {report}
    Extracted Result: {result}
    """
    example_prompt = PromptTemplate(
        input_variables=["report", "result"],
        template="""
        Report: {report}
        Extracted Result: {result}
        """
    )

    few_shot_prompt = FewShotPromptTemplate(
        examples=examples,
        example_prompt=example_prompt,
        input_variables=["report"],  # This is the variable for input prompts
        prefix="Given a medical report, extract the key information in the format of 'date', 'issue', and 'treatment'. Here are some examples:",
        suffix="Report: {report}\nExtracted Result:",  # End of the prompt where the new input is placed
    )

    chain = LLMChain(llm=llm, prompt=few_shot_prompt)
    result = chain.invoke({"report": report_text})

    extracted_data = extract_timeline_info(result['text'])
    #timelineinfo = extract_timeline_info(extracted_data)

    return extracted_data

import re

def extract_timeline_info(text):
    date_match = re.search(r"Date:\s*(\d{1,2}-\d{1,2}-\d{4})", text)
    issue_match = re.search(r"Issue:\s*(.+?)(?=(?:Treatment:|$))", text, re.DOTALL)
    treatment_match = re.search(r"Treatment:\s*(.+)", text, re.DOTALL)

    date = date_match.group(1) if date_match else "Date not found"
    issue = issue_match.group(1).strip() if issue_match else "Issue not found"
    treatment = treatment_match.group(1).strip() if treatment_match else "Treatment not found"

    return {"date": date, "issue": issue, "treatment": treatment}


def detect_text(image_content):
    """Detects text in the image content."""
    client = vision.ImageAnnotatorClient()
    image = vision.Image(content=image_content)
    
    # for dense text
    response = client.document_text_detection(image=image)
    texts = response.text_annotations
    
    if not texts:
        return ""
        
    # Return first text annotation which contains the full text
    return texts[0]






condition_mapping = {
    # Brain conditions
    "brain migraine": "brain",
    "brain concussion": "brain",
    "brain stroke": "brain",
    "brain tumor": "brain",
    "brain seizure": "brain",

    # Heart conditions
    "heart attack": "heart",
    "heart failure": "heart",
    "heart arrhythmia": "heart",
    "heart murmur": "heart",
    "heart angina": "heart",

    # Chest conditions
    "chest pain": "chest",
    "chest pneumonia": "chest",
    "chest bronchitis": "chest",
    "chest asthma": "chest",

    # Arm conditions
    "left arm fracture": "left arm",
    "right arm fracture": "right arm",
    "left arm strain": "left arm",
    "right arm strain": "right arm",

    # Leg conditions
    "left leg fracture": "left leg",
    "right leg fracture": "right leg",
    "left leg sprain": "left leg",
    "right leg sprain": "right leg",

    # Stomach conditions
    "stomach ulcer": "stomach",
    "stomach gastritis": "stomach",
    "stomach pain": "stomach",
    "stomach infection": "stomach",

    # Liver conditions
    "liver cirrhosis": "liver",
    "liver hepatitis": "liver",
    "liver failure": "liver",
    "liver disease": "liver",

    # Kidney conditions
    "left kidney stone": "left kidney",
    "right kidney stone": "right kidney",
    "left kidney infection": "left kidney",
    "right kidney infection": "right kidney",

    # Spine conditions
    "cervical spine pain": "cervical spine",
    "cervical spine herniation": "cervical spine",
    "thoracic spine scoliosis": "thoracic spine",
    "lumbar spine strain": "lumbar spine",

    # Shoulder conditions
    "shoulder blades pain": "shoulder blades",
    "shoulder blades strain": "shoulder blades",

    # Hip conditions
    "left hip arthritis": "left hip",
    "right hip arthritis": "right hip",
    "left hip pain": "left hip",
    "right hip pain": "right hip",

    # Gluteus conditions
    "left gluteus strain": "left gluteus",
    "right gluteus strain": "right gluteus",
    "left gluteus pain": "left gluteus",
    "right gluteus pain": "right gluteus",

    # Hamstring conditions
    "left hamstring strain": "left hamstring",
    "right hamstring strain": "right hamstring",
    "left hamstring tear": "left hamstring",
    "right hamstring tear": "right hamstring",

    # Calf conditions
    "left calf strain": "left calf",
    "right calf strain": "right calf",
    "left calf cramp": "left calf",
    "right calf cramp": "right calf"
}


def extract_text_from_pdf_file(pdf_file):
    try:
        # Create a PDF reader object directly from the file stream
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        # Get the number of pages
        num_pages = len(pdf_reader.pages)
        
        # Initialize text variable
        text = ""
        
        # Extract text from each page
        for page_num in range(num_pages):
            # Get the page object
            page = pdf_reader.pages[page_num]
            # Extract text from page
            text += page.extract_text() + "\n"
            
        return text
    except Exception as e:
        print(f"Error extracting text: {str(e)}")
        return None
    

conditions_list = list(condition_mapping.keys())

from sentence_transformers import SentenceTransformer, util
import faiss


similar_injuries = conditions_list

# Initialize the sentence transformer model
model = SentenceTransformer('all-mpnet-base-v2')

# Create embeddings for the similar injuries
injury_embeddings = model.encode(similar_injuries)

d = injury_embeddings.shape[1]  # Dimensionality of embeddings
index = faiss.IndexFlatL2(d)  # Use L2 distance for similarity
index.add(injury_embeddings)



def find_organ_details(report_text):
    report_embedding = model.encode(report_text)

    # Search the index for the most similar injury
    D, I = index.search(report_embedding.reshape(1, -1), k=1)  # Search for the top 1 match

    # Get the most similar injury from the list
    most_similar_injury = similar_injuries[I[0][0]]


    client = Groq(api_key="GROQ API")
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": f"you are summarizer"
            },
            {
                "role": "user",
                    "content": f"Create a very very brief summary of report {report_text} like just what happend for exapmle if it something related to leg facture and a rod was inserted  just give respond as Fractured Rod Inserted   you can take example from this  Fractured Rod Inserted,   Mild Gastritis,   Mild Arrhythmia, Kidney Stone 4mm, Mild Degeneration,   Muscle Strain Grade 2   just as small as that and nothing else  give one one point not more then that"
            }
        ],

        model="llama-3.2-11b-text-preview",
        temperature=1,
        )
    summary = chat_completion.choices[0].message.content
    

    return {condition_mapping[most_similar_injury]:summary}


REPORT = """Sunrise Medical Center
Discharge Summary
________________________________________
Patient Information
Name: Patricia Lewis
Age: 47 years
Gender: Female
Medical Record Number (MRN): 4455667788
Date of Admission: 10th August 2024
Date of Discharge: 17th August 2024
________________________________________
Admission Diagnosis
Acute Myocardial Infarction (AMI)
Discharge Diagnosis
Acute Myocardial Infarction, Post-Angioplasty Recovery
Attending Physician
Dr. James Walker, MD, Cardiologist
________________________________________
Reason for Admission
The patient presented with severe chest pain radiating to the left arm, shortness of breath, and nausea. Electrocardiogram (ECG) changes indicated an ST-elevation myocardial infarction (STEMI). The patient has risk factors including a history of hypertension and smoking.
Hospital Course and Management
Upon admission, the patient was administered aspirin, clopidogrel, and intravenous heparin to manage acute coronary syndrome. A coronary angiography was performed, revealing significant coronary artery blockage. The patient underwent successful percutaneous coronary intervention (PCI) with stent placement in the right coronary artery.
Post-procedure, the patient was placed on a regimen of antiplatelet therapy, statins, and other medications to prevent further cardiac events. The patient’s condition improved with treatment, and she was stable by discharge.
Diagnostic Tests and Procedures
•	ECG: Showed ST elevation in leads II, III, and aVF.
•	Cardiac Biomarkers: Elevated troponin I levels consistent with myocardial infarction.
•	Coronary Angiography: Revealed blockage in the right coronary artery.
•	Percutaneous Coronary Intervention (PCI): Successful stent placement in the right coronary artery.
Procedures Performed
•	Coronary Angiography: Diagnostic imaging of coronary arteries.
•	Percutaneous Coronary Intervention (PCI): Stent placement in the right coronary artery.
•	Medication Management: Initiation of antiplatelet therapy, anticoagulants, and statins.
Discharge Medications
•	Aspirin 81 mg PO daily
•	Clopidogrel 75 mg PO daily
•	Atorvastatin 40 mg PO daily
•	Metoprolol 50 mg PO twice daily
•	Lisinopril 10 mg PO daily
•	Nitroglycerin 0.4 mg SL as needed for chest pain
Follow-Up Care
1.	Cardiology: Follow-up appointment in 1 week to assess recovery and adjust medications.
2.	Primary Care: Visit in 2 weeks to manage risk factors such as hypertension and smoking cessation.
3.	Cardiac Rehabilitation: Referral for a structured program to aid in recovery and improve cardiovascular health.
4.	Lifestyle Modifications: Guidance on heart-healthy diet, regular exercise, and smoking cessation.
Patient Education
The patient was educated on the importance of medication adherence, recognizing symptoms of myocardial infarction, and lifestyle changes to reduce cardiovascular risk. Instructions were provided on managing medications, monitoring for side effects, and seeking prompt medical attention for any new or worsening symptoms.
Prognosis
With adherence to the medication regimen and lifestyle modifications, the patient is expected to recover well from the myocardial infarction. Continued follow-up and cardiac rehabilitation will be essential in improving cardiovascular health and preventing future cardiac events.
Discharging Physician
Dr. James Walker, MD
Sunrise Medical Center
________________________________________
Physician Signature
________________________________________
Dr. James Walker, MD
Date: 17th August 2024

"""
def update_organs(patient_id, organ_updates):
    """
    Update specific organ values while preserving other organ data.
    
    Args:
        patient_id (str): The patient's ID in Firebase
        organ_updates (dict): Dictionary containing organ updates
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Initialize Firebase and get Firestore client
        db = initialize_firebase()
        if not db:
            raise Exception("Failed to initialize Firebase")

        # Reference to the patient's document
        patient_ref = db.collection('patients').document(patient_id)
        
        # Get current document
        doc = patient_ref.get()
        if not doc.exists:
            print(f"Patient with ID {patient_id} not found")
            return False
            
        # Get current data
        current_data = doc.to_dict()
        
        # Get current organs data (if exists)
        medical_details = current_data.get('medicalDetails', {})
        current_organs = medical_details.get('organs', {})
        
        # Create updated organs dict by merging current data with updates
        updated_organs = dict(current_organs)
        for organ, value in organ_updates.items():
            updated_organs[organ] = value
        
        # Update the organs object while preserving other data
        patient_ref.set({
            'medicalDetails': {
                'organs': updated_organs
            }
        }, merge=True)  # merge=True ensures other fields aren't deleted
        
        print(f"Successfully updated organs data")
        return True
        
    except Exception as e:
        print(f"Error updating organs: {str(e)}")
        return False
    

def add_to_medical_history(patient_id, medical_data):
    """
    Insert a new record to the medicalHistory array with a new index.
    
    Args:
        patient_id (str): The patient's ID in Firebase
        medical_data (dict): Dictionary containing date, issue, and treatment
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Initialize Firebase and get Firestore client
        db = initialize_firebase()
        if not db:
            raise Exception("Failed to initialize Firebase")

        # Reference to the patient's document
        patient_ref = db.collection('patients').document(patient_id)
        
        # Get current document
        doc = patient_ref.get()
        if not doc.exists:
            print(f"Patient with ID {patient_id} not found")
            return False
            
        # Get the current data
        current_data = doc.to_dict()
        
        # Get medical details and history
        medical_details = current_data.get('medicalDetails', {})
        medical_history = medical_details.get('medicalHistory', {})
        
        # Find the highest existing index
        existing_indices = [int(idx) for idx in medical_history.keys() if idx.isdigit()]
        next_index = str(max(existing_indices + [-1]) + 1)  # If no indices exist, start at 0
        
        # Create new record at the new index
        new_record = {
            f'medicalDetails.medicalHistory.{next_index}': {
                'date': medical_data['date'],
                'issue': medical_data['issue'],
                'treatment': medical_data['treatment']
            }
        }
        
        # Update only the new record
        patient_ref.update(new_record)
        
        print(f"Successfully added new medical history record at index {next_index}")
        return True
        
    except Exception as e:
        print(f"Error adding medical history: {str(e)}")
        return False



print("ready to work!!!!")

@app.route('/message', methods=['POST'])
def receive_message():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['file']
        aadhar_number = request.form.get('aadhar_number')
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        if file and file.filename.endswith('.pdf'):
#             # Extract text directly from the uploaded file
            extracted_text = extract_text_from_pdf_file(file)
            
            if extracted_text:
                print("Extracted Text from PDF:")
                print("------------------------")
                data = find_organ_details(extracted_text)
                success = update_organs(aadhar_number,data)
                print(data)
                data = discharge_summary_to_json(extracted_text)
                print(data)
                success = add_to_medical_history(aadhar_number,data)
                print(data)

                print("------------------------")
                
                return jsonify({
                    "status": "success",
                    "message": "PDF text extracted successfully",
                    "text": extracted_text
                })
            else:
                return jsonify({
                    "status": "error",
                    "message": "Failed to extract text from PDF"
                }), 500
            
        return jsonify({'error': 'Invalid file type'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    


@app.route('/search-face', methods=['POST'])
def search_face():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    image = request.files['image']
    
    if not allowed_file(image.filename):
        return jsonify({"error": "Invalid file type"}), 400

    # Read and process image
    image_bytes = image.read()
    image_np = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
    
    try:
        girl_em = DeepFace.represent(img, model_name='Facenet')
        
        result = qdrant_client.search(
            collection_name="face_data",
            query_vector=girl_em[0]['embedding'],
            limit=1,
        )
        
        return jsonify({
            "adhaar": result[0].id,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/upload-face', methods=['POST'])
def upload_face():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    image = request.files['image']
    some_number = request.form.get('some_number')
    
    if not some_number:
        return jsonify({"error": "some_number is required"}), 400
    
    try:
        some_number = int(some_number)
    except ValueError:
        return jsonify({"error": "some_number must be an integer"}), 400
    
    if not allowed_file(image.filename):
        return jsonify({"error": "Invalid file type"}), 400

    # Read and process image
    image_bytes = image.read()
    image_np = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
    
    try:
        girl_em = DeepFace.represent(img, model_name='Facenet')
        
        # Check if collection exists
        try:
            qdrant_client.get_collection("face_data")
        except Exception as e:
            print("collection not found")
        
        # Upsert the face embedding
        qdrant_client.upsert(
            collection_name="face_data",
            points=[
                {
                    "id": some_number,
                    "vector": girl_em[0]['embedding'],
                }
            ]
        )
        
        return jsonify({"message": "Face uploaded successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/prescribe', methods=['POST'])
def process_prescription():
    try:
        # Check if both image and aadhar number are present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
            
        if 'aadhar_number' not in request.form:
            return jsonify({'error': 'No Aadhar number provided'}), 400
        
        image = request.files['image']
        aadhar_number = request.form['aadhar_number']
        
        # Validate aadhar number (basic validation - 12 digits)
        if not re.match(r'^\d{12}$', aadhar_number):
            return jsonify({'error': 'Invalid Aadhar number format'}), 400
        
        # Check if a file was actually selected
        if image.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        # Check file extension
        if not image.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            return jsonify({'error': 'Invalid file format'}), 400

        # Read image content
        image_content = image.read()
        
        # Get text from image using Google Cloud Vision
        extracted_text = detect_text(image_content)
        
        if not extracted_text:
            return jsonify({'error': 'No text detected in image'}), 400
        print(extracted_text)
        # Process with Groq
        client = Groq(api_key="GROQ API")
        completion = client.chat.completions.create(
            model="llama-3.2-11b-text-preview",
            messages=[
                {
                    "role": "user",
                    "content": f"This is a text extracted from medical prescription {extracted_text} just show only show up medicine names and in this format **medicine name** only medicine names nothing else"
                }
            ],
            temperature=1,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )

        # Get the generated text from Groq
        generated_text = completion.choices[0].message.content

        # Initialize Firebase
        db = initialize_firebase()
        if not db:
            return jsonify({'error': 'Failed to initialize Firebase'}), 500

        try:
            # Reference to the patient's document
            patient_ref = db.collection('patients').document(aadhar_number)
            
            # Update the currentMedications field
            patient_ref.set({
                'medicalDetails': {
                    'currentMedications': generated_text
                }
            }, merge=True)  # merge=True ensures other fields aren't deleted
            
            return jsonify({
                'text': generated_text,
                'message': 'Prescription processed and stored successfully',
                'aadhar_number': aadhar_number
            }), 200
            
        except Exception as e:
            print(f"Firebase update error: {str(e)}")
            return jsonify({'error': 'Failed to update medications in database'}), 500

    except Exception as e:
        print(f"Error processing prescription for Aadhar {request.form.get('aadhar_number', 'unknown')}: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)