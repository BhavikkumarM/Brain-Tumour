import streamlit as st
from PIL import Image
import numpy as np
from keras.models import load_model
import pandas as pd
import joblib
import os

# Function to load Alzheimer's disease prediction model
def load_alzheimer_model(model_path):
    model = load_model(model_path)
    return model

# Function to preprocess image for Alzheimer's disease prediction
def preprocess_alzheimer_image(image):
    img_resized = image.resize((224, 224))
    img_array = np.array(img_resized) / 255.0
    img_input = np.expand_dims(img_array, axis=0)
    return img_input

# Function to make Alzheimer's disease predictions
def predict_alzheimer(image, model):
    img_input = preprocess_alzheimer_image(image)
    prediction = model.predict(img_input)
    return prediction

# Function to load brain tumor prediction model
def load_tumor_model(model_path):
    model = load_model(model_path)
    return model

# Function to preprocess image for brain tumor prediction
def preprocess_tumor_image(image):
    img_resized = image.resize((64, 64))
    img_array = np.array(img_resized)
    img_input = img_array / 255.0
    img_input = np.expand_dims(img_input, axis=0)
    return img_input

# Function to make brain tumor predictions
def predict_tumor(image, model):
    img_input = preprocess_tumor_image(image)
    prediction = model.predict(img_input)
    return prediction

# Function to load dementia prediction model
def load_dementia_model(model_path):
    model = joblib.load(model_path)
    return model

# Function to preprocess input data for dementia prediction
def preprocess_dementia_input(input_data):
    input_df = pd.DataFrame(input_data, index=[0])
    input_df['M/F'] = input_df['M/F'].map({'M': 1, 'F': 0})
    input_df['Hand'] = input_df['Hand'].map({'R': 1, 'L': 0})
    input_df = input_df[['Age', 'EDUC', 'SES', 'MMSE', 'CDR', 'eTIV', 'nWBV', 'ASF']]
    processed_data = input_df.values
    return processed_data

# Function to make dementia predictions
def predict_dementia(input_data, model):
    processed_data = preprocess_dementia_input(input_data)
    prediction = model.predict(processed_data)
    return prediction

# Function to load Multiple Sclerosis prediction model
def load_ms_model(model_path):
    model = joblib.load(model_path)
    return model

import pandas as pd

def preprocess_ms_input(input_data):
    # Define the columns that are relevant for prediction
    relevant_columns = ['Patient ID', 'Age', 'Schooling', 'Gender', 'Breastfeeding', 'Varicella', 
                        'Initial Symptoms', 'Mono or Polysymptomatic', 'Oligoclonal Bands', 
                        'LLSSEP', 'ULSSEP', 'VEP', 'BAEP', 'Periventricular MRI', 'Cortical MRI', 
                        'Infratentorial MRI', 'Spinal Cord MRI', 'Initial EDSS', 'Final EDSS', 'Group']

    # Convert input_data dictionary to a DataFrame
    input_df = pd.DataFrame([input_data])

    # Check if 'Unnamed: 0' column is missing
    if 'Unnamed: 0' not in input_df.columns:
        # Add 'Unnamed: 0' column with default value
        input_df['Unnamed: 0'] = 0

    # Filter the DataFrame to keep only the relevant columns
    input_df = input_df[relevant_columns]

    # Rename columns to match the required format
    input_df.rename(columns={'Initial Symptoms': 'Initial_Symptom',
                              'Mono or Polysymptomatic': 'Mono_or_Polysymptomatic',
                              'Oligoclonal Bands': 'Oligoclonal_Bands',
                              'Periventricular MRI': 'Periventricular_MRI',
                              'Cortical MRI': 'Cortical_MRI',
                              'Infratentorial MRI': 'Infratentorial_MRI',
                              'Spinal Cord MRI': 'Spinal_Cord_MRI',
                              'Initial EDSS': 'Initial_EDSS',
                              'Final EDSS': 'Final_EDSS'}, inplace=True)

    return input_df






# Function to make Multiple Sclerosis predictions
def predict_ms(input_data, model):
    # Preprocess the input data
    input_df = preprocess_ms_input(input_data)

    # Call the model's predict method with the preprocessed data
    prediction = model.predict(input_df)
    
    return prediction


# ---------------------------------------Load models------------------------------------------------
alzheimer_model_path = 'ALZCLASS_40EPK.h5'
alzheimer_model = load_alzheimer_model(alzheimer_model_path)

tumor_model_path = 'BrainTumor_10epoch.h5'
tumor_model = load_tumor_model(tumor_model_path)

dementia_model_path = 'BRAIN DEMENTIA PREDICT/Brain_alz_ML.pkl'
dementia_model = load_dementia_model(dementia_model_path)

# Relative path to the Multiple Sclerosis prediction model
ms_model_path = 'MULTIPLE SCLEROSIS/ryougi_shiki_model.joblib'
ms_model = load_ms_model(ms_model_path)

# ---------------------------------------Streamlit UI------------------------------------------------------
st.set_page_config()

st.sidebar.title("Select Disease")

selected_disease = st.sidebar.selectbox("Select", ['Alzheimer\'s Disease Prediction',
                                                           'Brain Tumor Prediction',
                                                           'Dementia Prediction',
                                                           ])

if selected_disease == 'Alzheimer\'s Disease Prediction':
    st.title("Alzheimer's Disease Prediction")

    uploaded_image = st.file_uploader("Upload an MRI brain scan image", type=["jpg", "png"])

    if uploaded_image is not None:
        image = Image.open(uploaded_image)
        st.image(image, caption="Uploaded MRI brain scan", use_column_width=True)

        if st.button("Predict"):
            prediction = predict_alzheimer(image, alzheimer_model)

            # Get the index of the maximum value in the prediction array
            prediction_index = np.argmax(prediction)

            # Convert the index to the corresponding class label
            class_labels = ["Non-Demented", "Very Mild Demented", "Mild Demented", "Moderate Demented"]
            prediction_class = class_labels[prediction_index]

            st.write("Prediction:", prediction_class)

elif selected_disease == 'Brain Tumor Prediction':
    st.title("Brain Tumor Prediction")

    uploaded_image = st.file_uploader("Upload an MRI brain scan image", type=["jpg", "png"])

    if uploaded_image is not None:
        image = Image.open(uploaded_image)
        st.image(image, caption="Uploaded MRI brain scan", use_column_width=True)

        if st.button("Predict"):
            prediction = predict_tumor(image, tumor_model)

            threshold = 0.5

            # Check if prediction probability is above the threshold
            if prediction[0] > threshold:
                st.write("It is predicted that you might have a brain tumor.")
            else:
                st.write("No brain tumor is detected.")
elif selected_disease == 'Dementia Prediction':
    st.title("Dementia Prediction")

    age = st.number_input("Enter age", min_value=0, max_value=120, step=1)
    educ = st.number_input("Enter years of education", min_value=0, step=1)
    ses = st.selectbox("Select socioeconomic status", [0, 1, 2])
    mmse = st.number_input("Enter Mini Mental State Examination score", min_value=0, max_value=30, step=1)
    cdr = st.number_input("Enter CDR", min_value=0.0, max_value=2.0, step=0.1)
    etiv = st.number_input("Enter Estimated Total Intracranial Volume", min_value=0, step=1)
    wbv = st.number_input("Enter Normalized Whole Brain Volume", min_value=0.0, max_value=1.0, step=0.01)
    asf = st.number_input("Enter Atlas Scaling Factor", min_value=0.0, step=0.01)
    gender = st.radio("Select gender", ('M', 'F'))
    hand = st.radio("Select handedness", ('R', 'L'))

    if st.button("Predict"):
        input_data = {
            'Age': age,
            'EDUC': educ,
            'SES': ses,
            'MMSE': mmse,
            'CDR': cdr,
            'eTIV': etiv,
            'nWBV': wbv,
            'ASF': asf,
            'M/F': gender,
            'Hand': hand
        }

        # Check if the Clinical Dementia Rating is greater than 0.5 to determine dementia
        if cdr > 0.5:
            prediction = " You are predicted to have Dementia"
        else:
            prediction = "You do not have Dementia"

        # Display the prediction result
        st.write(prediction)

        
