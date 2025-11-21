# Data236_Lab

To run the project, follow the steps:
1. Go to Terminal
2. Move to the file direction `cd Data236_Lab-main`
3. Then set up the environment `docker compose up -d`
4. Example owner and traveler login email and password:
<table>
  <tr>
    <th>Role</th>
    <th>Email</th>
    <th>Password</th>
  </tr>
  <tr>
    <td>Owner</td>
    <td>shao-yu.huang@sjsu.edu</td>
    <td>sandy0318</td>
  </tr>
  <tr>
    <td>Traveler</td>
    <td>taylor.swift@sjsu.edu</td>
    <td>demo1234</td>
  </tr>
</table>

# Agent Setup

1. Create a virtual environment and activate it.
2. Install dependencies with `pip install -r requirements.txt`.
3. Copy `.env.example` to `.env` and fill in required keys.
4. Start the agent with `uvicorn agent.main:app --reload`.

