from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
AUTH = ("neo4j", "collabrix123")

def seed():
    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session() as session:
            with open("src/main/resources/data/seed-data.cypher", "r") as f:
                content = f.read()
                
            statements = [s.strip() for s in content.split(";") if s.strip()]
            for stmt in statements:
                print(f"Executing: {stmt[:50]}...")
                session.run(stmt)
            print("Seed complete.")
            
            res = session.run("MATCH (cr:ConnectionRequest) RETURN cr.fromEmployeeId, cr.toEmployeeId, cr.status, cr.relationshipType LIMIT 5")
            records = list(res)
            for record in records:
                print(record)
            
            count = session.run("MATCH (cr:ConnectionRequest) RETURN count(cr)").single()[0]
            print("Total CR nodes:", count)

if __name__ == "__main__":
    seed()
