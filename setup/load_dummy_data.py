
import uuid
from datetime import datetime
import psycopg
from libs.load_yaml import load_yaml


# DSN設定の読み込み
config = load_yaml("config/db_config.yaml")["database"]

with psycopg.connect(
    dbname=config["dbname"],
    user=config["user"],
    password=config["password"],
    host=config["host"],
    port=config["port"],
    autocommit=True
) as conn:

    with conn.cursor() as cur:
        # TRUNCATE（外部キー制約の順序に注意）
        cur.execute("TRUNCATE TABLE users RESTART IDENTITY CASCADE;")
        cur.execute("TRUNCATE TABLE titles RESTART IDENTITY CASCADE;")
        cur.execute("TRUNCATE TABLE organizations RESTART IDENTITY CASCADE;")

        # YAML読み込み
        org_data = load_yaml("data/organizations.yaml")["organizations"]
        title_data = load_yaml("data/titles.yaml")["titles"]
        user_data = load_yaml("data/users.yaml")["users"]

        # organizations
        org_map = {}
        for org in org_data:
            cur.execute("""
                INSERT INTO organizations (name, code, full_path)
                VALUES (%s, %s, %s)
                RETURNING id
            """, (org["name"], org["code"], org["full_path"]))
            org_id = cur.fetchone()[0]
            org_map[org["name"]] = org_id

        # titles
        title_map = {}
        for title in title_data:
            cur.execute("""
                INSERT INTO titles (name)
                VALUES (%s)
                RETURNING id
            """, (title["name"],))
            title_id = cur.fetchone()[0]
            title_map[title["name"]] = title_id

        # users
        for user in user_data:
            cur.execute("""
                INSERT INTO users (
                    user_id, password, username, email,
                    organization_id, title_id, title_name,
                    must_change_password
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user["user_id"],
                user["password"],
                user["username"],
                user["email"],
                org_map[user["organization"]],
                title_map[user["title"]],
                user["title_name"],
                user["must_change_password"]
            ))
