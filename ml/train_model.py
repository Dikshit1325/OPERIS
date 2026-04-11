import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib

data = {
    "hours_worked":   [25,30,35,38,40,42,45,48,50,55,60],
    "meetings_count": [2,3,3,4,4,5,6,7,8,9,10],
    "tasks_completed":[22,20,18,19,17,16,14,12,10,8,5],
    "sentiment":      [0,0,0,0,0.5,0.5,0.5,1,1,1,1],
    "burnout":        [0,0,0,0,0,0,1,1,1,1,1]
}

df = pd.DataFrame(data)

X = df[["hours_worked", "meetings_count", "sentiment", "tasks_completed"]]
y = df["burnout"]

model = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression())
])

model.fit(X, y)

joblib.dump(model, "burnout_model.pkl")

print("Model retrained successfully!")