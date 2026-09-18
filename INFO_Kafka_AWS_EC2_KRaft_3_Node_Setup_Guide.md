**Apache Kafka on AWS EC2**

**3-Node KRaft Cluster on a Single EC2 Instance**

PulseDesk learning / POC setup

This guide documents the working setup used to run three Kafka
broker/controller processes on one AWS EC2 instance and connect local
Spring Boot producer and consumer applications to it.

| **Mode**               | KRaft (no ZooKeeper)                          |
|------------------------|-----------------------------------------------|
| **EC2 public IP used** | 3.145.127.180                                 |
| **Broker ports**       | 9092, 9094, 9096                              |
| **Controller ports**   | 9093, 9095, 9097                              |
| **Kafka processes**    | 3 combined broker + controller nodes          |
| **Purpose**            | Learning / development POC, not production HA |

# 1. Final Architecture

Local Mac  
├─ PulseDesk Spring Boot producer  
└─ PulseDesk Assignment Service consumer  
\|  
\| PLAINTEXT Kafka  
v  
AWS EC2: 3.145.127.180  
├─ Node 1: broker 9092 + controller 9093  
├─ Node 2: broker 9094 + controller 9095  
└─ Node 3: broker 9096 + controller 9097

KRaft controller quorum:  
1@localhost:9093,2@localhost:9095,3@localhost:9097

**Note:** All three Kafka nodes are on the same EC2 instance. This is
useful for learning partitions, replication, ISR, leaders,
producer/consumer behavior, and KRaft, but it is not real high
availability. If the EC2 instance fails, all three Kafka processes fail.

# 2. EC2 Prerequisites

- Amazon Linux 2023 (x86_64 is fine).

- Recommended for this 3-process POC: t3.large (2 vCPU, 8 GB RAM). A
  t3.medium can work for lighter experimentation.

- 50 GB gp3 is a comfortable learning size.

- Java 17 or newer for modern Kafka releases.

- Kafka extracted under /home/ec2-user/kafka.

- SSH access from your Mac.

# 3. AWS Security Group

Allow only the ports that must be reached from outside the EC2 instance.

| **Port** | **Protocol** | **Source**         | **Purpose**    |
|----------|--------------|--------------------|----------------|
| 22       | TCP          | Your public IP /32 | SSH            |
| 9092     | TCP          | Your public IP /32 | Kafka broker 1 |
| 9094     | TCP          | Your public IP /32 | Kafka broker 2 |
| 9096     | TCP          | Your public IP /32 | Kafka broker 3 |

**Note:** Do not expose controller ports 9093, 9095, and 9097 to the
internet. They are used internally by the KRaft quorum. Also avoid
0.0.0.0/0 for PLAINTEXT Kafka except for a very temporary test.

# 4. Install Java and Kafka

Install Java and verify it:

sudo dnf install java-17-amazon-corretto -y  
java -version

Download a Kafka binary release from the Apache Kafka website, extract
it, and keep the installation directory as /home/ec2-user/kafka. If you
already have the kafka directory, continue to the next section.

cd /home/ec2-user  
ls  
cd kafka  
ls

# 5. Create Persistent Kafka Data Directories

sudo mkdir -p /var/lib/kafka/server-1  
sudo mkdir -p /var/lib/kafka/server-2  
sudo mkdir -p /var/lib/kafka/server-3

sudo chown -R ec2-user:ec2-user /var/lib/kafka

# 6. Create the Three KRaft Configuration Files

Place the following files under /home/ec2-user/kafka/config/kraft/. The
public IP must be the EC2 public IP that your local applications can
reach.

## 6.1 server-1.properties

process.roles=broker,controller  
node.id=1

controller.quorum.voters=1@localhost:9093,2@localhost:9095,3@localhost:9097

listeners=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093  
advertised.listeners=PLAINTEXT://3.145.127.180:9092

listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT  
inter.broker.listener.name=PLAINTEXT  
controller.listener.names=CONTROLLER

log.dirs=/var/lib/kafka/server-1

num.partitions=3

offsets.topic.replication.factor=3  
transaction.state.log.replication.factor=3  
transaction.state.log.min.isr=2

group.initial.rebalance.delay.ms=0

## 6.2 server-2.properties

process.roles=broker,controller  
node.id=2

controller.quorum.voters=1@localhost:9093,2@localhost:9095,3@localhost:9097

listeners=PLAINTEXT://0.0.0.0:9094,CONTROLLER://0.0.0.0:9095  
advertised.listeners=PLAINTEXT://3.145.127.180:9094

listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT  
inter.broker.listener.name=PLAINTEXT  
controller.listener.names=CONTROLLER

log.dirs=/var/lib/kafka/server-2

num.partitions=3

offsets.topic.replication.factor=3  
transaction.state.log.replication.factor=3  
transaction.state.log.min.isr=2

group.initial.rebalance.delay.ms=0

## 6.3 server-3.properties

process.roles=broker,controller  
node.id=3

controller.quorum.voters=1@localhost:9093,2@localhost:9095,3@localhost:9097

listeners=PLAINTEXT://0.0.0.0:9096,CONTROLLER://0.0.0.0:9097  
advertised.listeners=PLAINTEXT://3.145.127.180:9096

listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT  
inter.broker.listener.name=PLAINTEXT  
controller.listener.names=CONTROLLER

log.dirs=/var/lib/kafka/server-3

num.partitions=3

offsets.topic.replication.factor=3  
transaction.state.log.replication.factor=3  
transaction.state.log.min.isr=2

group.initial.rebalance.delay.ms=0

**Note:** The critical setting for local applications is
advertised.listeners. If it says localhost, a client on your Mac can
make the initial bootstrap connection but Kafka metadata will tell it to
connect to localhost on the Mac, which then fails. For this setup,
advertise 3.145.127.180 on broker ports 9092, 9094, and 9096.

# 7. Editing the Files with vi

The workflow you used is fine. Open each file:

vi config/kraft/server-1.properties  
vi config/kraft/server-2.properties  
vi config/kraft/server-3.properties

To replace the entire file contents inside vi:

:%d  
i  
\# paste the new content  
Esc  
:wq

If pasting large configuration blocks causes strange indentation or
formatting, enable paste mode before pasting:

:set paste  
i  
\# paste  
Esc  
:set nopaste  
:wq

# 8. Copy Local Configuration Files to EC2 Instead of Using Termius UI

A simpler repeatable method is scp from the Mac terminal. Assume the EC2
SSH key is ~/Downloads/my-kafka-key.pem and the three files are in a
local directory.

chmod 400 ~/Downloads/my-kafka-key.pem

scp -i ~/Downloads/my-kafka-key.pem server-1.properties
server-2.properties server-3.properties
<ec2-user@3.145.127.180>:/home/ec2-user/kafka/config/kraft/

To copy an entire local folder:

scp -i ~/Downloads/my-kafka-key.pem -r ./kafka-config
<ec2-user@3.145.127.180>:/home/ec2-user/

To copy a file back from EC2 to the Mac:

scp -i ~/Downloads/my-kafka-key.pem
<ec2-user@3.145.127.180>:/home/ec2-user/kafka/config/kraft/server-1.properties
./server-1.properties

**Note:** If you use an SSH config alias or a different username/key
path, adjust the command. Termius file transfer is also valid; scp is
simply easier to document, automate, and repeat.

# 9. Generate One KRaft Cluster ID

A single KRaft cluster ID must be used to format all three node storage
directories.

cd /home/ec2-user/kafka

KAFKA_CLUSTER_ID="\$(bin/kafka-storage.sh random-uuid)"  
echo "\$KAFKA_CLUSTER_ID"

**Note:** Generate the cluster ID once. Do not generate a different ID
for each node.

# 10. Format the Three Nodes - Initial Setup Only

bin/kafka-storage.sh format -t "\$KAFKA_CLUSTER_ID" -c
config/kraft/server-1.properties  
bin/kafka-storage.sh format -t "\$KAFKA_CLUSTER_ID" -c
config/kraft/server-2.properties  
bin/kafka-storage.sh format -t "\$KAFKA_CLUSTER_ID" -c
config/kraft/server-3.properties

**Note:** Do this only when initializing the cluster storage. Do not run
kafka-storage.sh format every time Kafka restarts; formatting is not a
normal restart step.

# 11. Start All Three Kafka Processes in Detached Mode

For an 8 GB EC2 instance, a 1 GB heap per Kafka process is reasonable
for this POC:

export KAFKA_HEAP_OPTS="-Xms1G -Xmx1G"

bin/kafka-server-start.sh -daemon config/kraft/server-1.properties  
bin/kafka-server-start.sh -daemon config/kraft/server-2.properties  
bin/kafka-server-start.sh -daemon config/kraft/server-3.properties

Kafka also benefits from Linux page cache, so avoid assigning almost all
server RAM to JVM heap.

# 12. Verify the Processes and Ports

jps

sudo ss -lntp \| grep -E '9092\|9093\|9094\|9095\|9096\|9097'

You should have three Kafka JVMs and six listening ports:

Broker 1 9092  
Controller 1 9093  
Broker 2 9094  
Controller 2 9095  
Broker 3 9096  
Controller 3 9097

# 13. Check Kafka Logs

tail -f logs/server.log

**Note:** When multiple Kafka processes use the same default logging
configuration, log output can be mixed in the same server.log. For a
more polished setup, give each process its own Log4j configuration/log
file.

# 14. Verify the KRaft Cluster

## 14.1 Confirm all three brokers

bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092

A healthy cluster should report broker IDs 1, 2, and 3.

## 14.2 Confirm the metadata quorum

bin/kafka-metadata-quorum.sh --bootstrap-server localhost:9092 describe
--status

Your working cluster showed three voters and zero follower lag:

CurrentVoters:  
1 -\> CONTROLLER://localhost:9093  
2 -\> CONTROLLER://localhost:9095  
3 -\> CONTROLLER://localhost:9097

MaxFollowerLag: 0

# 15. Test Topic Creation from the EC2 CLI

bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic
test-rf3 --partitions 3 --replication-factor 3 --config
min.insync.replicas=2

Expected result:

Created topic test-rf3.

# 16. List and Describe Topics

bin/kafka-topics.sh --bootstrap-server localhost:9092 --list

Describe all topics:

bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe

Describe one topic:

bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic
pulsedesk.ticket-events

# 17. Spring Boot Producer Configuration

Use the global Spring Kafka bootstrap property so KafkaAdmin and the
producer use the same remote cluster.

spring.kafka.bootstrap-servers=3.145.127.180:9092,3.145.127.180:9094,3.145.127.180:9096

spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer  
spring.kafka.producer.value-serializer=org.springframework.kafka.support.serializer.JacksonJsonSerializer  
spring.kafka.producer.acks=all

spring.kafka.producer.properties.delivery.timeout.ms=120000  
spring.kafka.producer.properties.linger.ms=0  
spring.kafka.producer.properties.request.timeout.ms=30000

spring.kafka.producer.properties.enable.idempotence=true  
spring.kafka.producer.properties.max.in.flight.requests.per.connection=5

With acks=all, idempotence enabled, and
max.in.flight.requests.per.connection \<= 5, the producer has a safer
delivery configuration.

# 18. PulseDesk Producer Java Configuration

@Configuration  
public class KafkaProducerConfig {

@Value("\${spring.kafka.bootstrap-servers}")  
private String bootstrapServers;

@Value("\${spring.kafka.producer.key-serializer}")  
private String keySerializer;

@Value("\${spring.kafka.producer.value-serializer}")  
private String valueSerializer;

@Value("\${spring.kafka.producer.acks}")  
private String acks;

@Value("\${spring.kafka.producer.properties.delivery.timeout.ms}")  
private String deliveryTimeout;

@Value("\${spring.kafka.producer.properties.linger.ms}")  
private String linger;

@Value("\${spring.kafka.producer.properties.request.timeout.ms}")  
private String requestTimeout;

@Value("\${spring.kafka.producer.properties.enable.idempotence}")  
private boolean idempotence;

@Value("\${spring.kafka.producer.properties.max.in.flight.requests.per.connection}")  
private Integer inflightRequests;

Map\<String, Object\> producerConfigs() {  
Map\<String, Object\> config = new HashMap\<\>();

config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);  
config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, keySerializer);  
config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,
valueSerializer);  
config.put(ProducerConfig.ACKS_CONFIG, acks);  
config.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG,
deliveryTimeout);  
config.put(ProducerConfig.LINGER_MS_CONFIG, linger);  
config.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, requestTimeout);  
config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, idempotence);  
config.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION,
inflightRequests);

return config;  
}

@Bean  
ProducerFactory\<String, TicketCreatedEvent\> producerFactory() {  
return new DefaultKafkaProducerFactory\<\>(producerConfigs());  
}

@Bean  
KafkaTemplate\<String, TicketCreatedEvent\> kafkaTemplate() {  
return new KafkaTemplate\<\>(producerFactory());  
}

@Bean  
NewTopic createTicketEventsTopic() {  
return TopicBuilder.name("pulsedesk.ticket-events")  
.partitions(3)  
.replicas(3)  
.configs(Map.of("min.insync.replicas", "2"))  
.build();  
}

@Bean  
NewTopic createAssetEventsTopic() {  
return TopicBuilder.name("pulsedesk.asset-events")  
.partitions(3)  
.replicas(3)  
.configs(Map.of("min.insync.replicas", "2"))  
.build();  
}

@Bean  
NewTopic ticketEventsDltTopic() {  
return TopicBuilder.name("pulsedesk.ticket-events-dlt")  
.partitions(3)  
.replicas(3)  
.configs(Map.of("min.insync.replicas", "2"))  
.build();  
}  
}

# 19. Why the Topics Initially Did Not Appear

The NewTopic beans were correct and the three-broker cluster was
healthy. The actual problem was advertised.listeners.

\# Incorrect for an application running on your Mac  
advertised.listeners=PLAINTEXT://localhost:9092  
advertised.listeners=PLAINTEXT://localhost:9094  
advertised.listeners=PLAINTEXT://localhost:9096

\# Correct for the current external EC2 setup  
advertised.listeners=PLAINTEXT://3.145.127.180:9092  
advertised.listeners=PLAINTEXT://3.145.127.180:9094  
advertised.listeners=PLAINTEXT://3.145.127.180:9096

Kafka clients use bootstrap.servers only for initial contact. After
that, Kafka returns broker metadata. If the metadata contains localhost,
a client on the Mac tries to connect back to the Mac instead of EC2.

Mac Spring Boot  
\|  
\| bootstrap -\> 3.145.127.180:9092  
v  
Kafka Broker  
\|  
\| broker metadata  
v  
WRONG: localhost:9092 -\> Mac itself  
RIGHT: 3.145.127.180:9092 -\> EC2 broker

# 20. Restart Kafka After Changing advertised.listeners

pkill -f kafka.Kafka

jps

export KAFKA_HEAP_OPTS="-Xms1G -Xmx1G"

bin/kafka-server-start.sh -daemon config/kraft/server-1.properties  
bin/kafka-server-start.sh -daemon config/kraft/server-2.properties  
bin/kafka-server-start.sh -daemon config/kraft/server-3.properties

jps

**Note:** Do not format the storage again when doing this restart.

# 21. Verify Remote Connectivity from the Mac

nc -vz 3.145.127.180 9092  
nc -vz 3.145.127.180 9094  
nc -vz 3.145.127.180 9096

All three should report a successful TCP connection.

# 22. Spring Boot Consumer Configuration

Because the assignment service also runs on your Mac, it must use the
EC2 brokers rather than localhost.

spring.application.name=pulsedesk-assignment-service  
server.port=0

pulsedesk.base-url=\${PULSEDESK_BASE_URL:http://localhost:80}

spring.kafka.bootstrap-servers=3.145.127.180:9092,3.145.127.180:9094,3.145.127.180:9096

spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer  
spring.kafka.consumer.value-deserializer=org.springframework.kafka.support.serializer.JacksonJsonDeserializer  
spring.kafka.consumer.group-id=pulsedesk-ticket-assignment-group

# 23. Read Messages Directly from Kafka

Read all retained records from the beginning:

bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic
pulsedesk.ticket-events --from-beginning

Show partition, offset, key, and timestamp:

bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic
pulsedesk.ticket-events --from-beginning --property print.partition=true
--property print.offset=true --property print.key=true --property
print.timestamp=true

The console consumer stays running and also prints new messages as they
arrive. Use Ctrl+C to stop it. Reading a message does not delete it from
Kafka.

# 24. Complete End-to-End Validation

1.  Start all three Kafka processes on EC2.

2.  Verify ports and broker IDs.

3.  Start the PulseDesk producer application on the Mac.

4.  Confirm its startup log shows bootstrap.servers =
    \[3.145.127.180:9092, 3.145.127.180:9094, 3.145.127.180:9096\].

5.  Verify the NewTopic beans create pulsedesk.ticket-events,
    pulsedesk.asset-events, and pulsedesk.ticket-events-dlt.

6.  Start the assignment-service consumer on the Mac.

7.  Create a ticket in PulseDesk so the producer publishes an event.

8.  Use kafka-console-consumer.sh on EC2 to confirm the actual
    JSON/event is present.

9.  Confirm the assignment-service consumer receives and processes the
    event.

# 25. Useful Day-to-Day Commands

| **Task**                     | **Command**                                                                                                      |
|------------------------------|------------------------------------------------------------------------------------------------------------------|
| List topics                  | bin/kafka-topics.sh --bootstrap-server localhost:9092 --list                                                     |
| Describe topic               | bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic pulsedesk.ticket-events                 |
| Check brokers                | bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092                                               |
| Check KRaft quorum           | bin/kafka-metadata-quorum.sh --bootstrap-server localhost:9092 describe --status                                 |
| Check JVMs                   | jps                                                                                                              |
| Check ports                  | sudo ss -lntp \| grep -E '9092\|9093\|9094\|9095\|9096\|9097'                                                    |
| Watch messages               | bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic pulsedesk.ticket-events --from-beginning |
| Stop all Kafka POC processes | pkill -f kafka.Kafka                                                                                             |

# 26. Important Operational Notes

- Use an Elastic IP if you want the broker address to remain stable. A
  normal EC2 public IPv4 can change after stop/start.

- If the public IP changes, update advertised.listeners on all three
  brokers and spring.kafka.bootstrap-servers in local services.

- The controller ports are internal and should stay closed to the
  internet.

- PLAINTEXT is acceptable for a tightly restricted personal POC, but
  production Kafka should use proper authentication/encryption and
  private networking.

- Do not store real database passwords or other secrets directly in
  committed application.properties files. Prefer environment variables
  or a secrets manager.

- Running three Kafka processes on one EC2 teaches Kafka clustering
  concepts but does not provide fault tolerance against EC2 failure.

- For a more production-like architecture, put brokers on separate
  instances/AZs or use a managed service such as Amazon MSK.

# 27. Troubleshooting Checklist

| **Symptom**                                            | **What to check**                                                                                               |
|--------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Spring shows localhost:9092                            | Use spring.kafka.bootstrap-servers with the EC2 public IP. Search the codebase for old localhost:9092 values.   |
| Spring can bootstrap but topic/message operations fail | Check advertised.listeners. They must advertise externally reachable EC2 broker addresses.                      |
| One broker port is unreachable                         | Check jps, ss, Kafka logs, and the EC2 security group.                                                          |
| Replication factor 3 fails                             | Verify all three brokers are running and registered with kafka-broker-api-versions.sh.                          |
| Topics are not auto-created                            | Enable KafkaAdmin debug logs, verify broker connectivity, then confirm the NewTopic beans are being discovered. |
| Cluster fails after restart                            | Do not reformat storage. Check that all three configs still use the same original cluster storage.              |
| Works inside EC2 but not from Mac                      | Check security group, advertised.listeners, current EC2 public IP, and nc connectivity from the Mac.            |

# 28. Clean Setup Command Sequence

This is the cleaned-up equivalent of the successful shell history,
excluding repeated navigation and accidental commands:

cd /home/ec2-user/kafka

\# 1. Put server-1.properties, server-2.properties and
server-3.properties  
\# under config/kraft/

\# 2. Create persistent log directories  
sudo mkdir -p /var/lib/kafka/server-{1,2,3}  
sudo chown -R ec2-user:ec2-user /var/lib/kafka

\# 3. Initial cluster format - ONCE  
KAFKA_CLUSTER_ID="\$(bin/kafka-storage.sh random-uuid)"  
bin/kafka-storage.sh format -t "\$KAFKA_CLUSTER_ID" -c
config/kraft/server-1.properties  
bin/kafka-storage.sh format -t "\$KAFKA_CLUSTER_ID" -c
config/kraft/server-2.properties  
bin/kafka-storage.sh format -t "\$KAFKA_CLUSTER_ID" -c
config/kraft/server-3.properties

\# 4. Start  
export KAFKA_HEAP_OPTS="-Xms1G -Xmx1G"  
bin/kafka-server-start.sh -daemon config/kraft/server-1.properties  
bin/kafka-server-start.sh -daemon config/kraft/server-2.properties  
bin/kafka-server-start.sh -daemon config/kraft/server-3.properties

\# 5. Verify  
jps  
sudo ss -lntp \| grep -E '9092\|9093\|9094\|9095\|9096\|9097'  
bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092  
bin/kafka-metadata-quorum.sh --bootstrap-server localhost:9092 describe
--status

\# 6. List topics  
bin/kafka-topics.sh --bootstrap-server localhost:9092 --list

\# 7. Watch PulseDesk events  
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic
pulsedesk.ticket-events --from-beginning

# 29. Final Working Flow

PulseDesk (Spring Boot producer on Mac)  
\|  
\| spring.kafka.bootstrap-servers  
\| 3.145.127.180:9092,9094,9096  
v  
+---------------------------------------------+  
\| AWS EC2 \|  
\| \|  
\| Kafka Node 1 broker 9092 / controller 9093 \|  
\| Kafka Node 2 broker 9094 / controller 9095 \|  
\| Kafka Node 3 broker 9096 / controller 9097 \|  
\| \|  
\| KRaft quorum: 1, 2, 3 \|  
+---------------------------------------------+  
\|  
v  
pulsedesk.ticket-events  
\|  
v  
Assignment Service consumer on Mac

**End of guide**
